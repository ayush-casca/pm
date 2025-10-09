import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// GitHub webhook event types we care about
type GitHubWebhookEvent = 
  | 'pull_request'
  | 'push'
  | 'create'
  | 'delete';

interface GitHubPullRequestPayload {
  action: 'opened' | 'synchronize' | 'closed' | 'reopened' | 'converted_to_draft' | 'ready_for_review';
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    draft: boolean;
    merged: boolean;
    user: {
      login: string;
      email?: string;
    };
    head: {
      ref: string; // branch name
      sha: string;
      repo: {
        full_name: string; // owner/repo
      };
    };
    base: {
      ref: string; // target branch (usually main)
    };
    html_url: string;
    commits: number;
    additions: number;
    deletions: number;
    changed_files: number;
    created_at: string;
    updated_at: string;
  };
  repository: {
    full_name: string;
  };
}

interface GitHubPushPayload {
  ref: string; // refs/heads/branch-name
  before: string; // previous commit SHA
  after: string; // new commit SHA
  commits: Array<{
    id: string; // commit SHA
    message: string;
    author: {
      name: string;
      email: string;
    };
    url: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  repository: {
    full_name: string;
  };
  head_commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    url: string;
  } | null;
}

// Extract ticket references from text (PR body, commit messages)
function extractTicketReferences(text: string): string[] {
  const ticketPatterns = [
    /(?:closes?|fixes?|resolves?)\s+#?(\w+-\d+)/gi,
    /(?:refs?|references?)\s+#?(\w+-\d+)/gi,
    /(\w+-\d+)(?:\s|$|[^\w-])/g, // TICKET-123 anywhere
    /\[(\w+-\d+)\]/g, // [TICKET-123] format
  ];

  const matches = new Set<string>();
  
  for (const pattern of ticketPatterns) {
    const found = text.matchAll(pattern);
    for (const match of found) {
      if (match[1]) {
        matches.add(match[1].toUpperCase());
      }
    }
  }

  return Array.from(matches);
}

// Find project by repository name
async function findProjectByRepo(repoName: string) {
  console.log('🔍 Looking for repo:', repoName);

  const allProjects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      githubRepoName: true,
      githubRepoUrl: true
    }
  });

  console.log('📋 All projects:', allProjects);
  
  return await prisma.project.findFirst({
    where: {
      OR: [
        { githubRepoName: repoName },
        { githubRepoUrl: { contains: repoName } },
      ],
    },
  });
}

// Find or create GitHub branch
async function findOrCreateBranch(
  projectId: string,
  branchName: string,
  branchUrl: string,
  author: string,
  authorEmail?: string
) {
  const existingBranch = await prisma.gitHubBranch.findUnique({
    where: {
      projectId_name: {
        projectId,
        name: branchName,
      },
    },
  });

  if (existingBranch) {
    return existingBranch;
  }

  return await prisma.gitHubBranch.create({
    data: {
      projectId,
      name: branchName,
      url: branchUrl,
      author,
      authorEmail,
    },
  });
}

// Find tickets by reference
async function findTicketsByReferences(projectId: string, references: string[]) {
  if (references.length === 0) return [];
  
  return await prisma.ticket.findMany({
    where: {
      projectId,
      name: {
        in: references.map(ref => ref.toLowerCase()),
        mode: 'insensitive',
      },
    },
  });
}

// Handle pull request events
async function handlePullRequest(payload: GitHubPullRequestPayload) {
  const { action, pull_request, repository } = payload;
  
  // Log the full PR data for debugging
  console.log(`🔍 Full PR Data:`, {
    action,
    number: pull_request.number,
    title: pull_request.title,
    body: pull_request.body,
    state: pull_request.state,
    merged: pull_request.merged,
    author: pull_request.user.login,
    branch: pull_request.head.ref,
    baseBranch: pull_request.base.ref,
    additions: pull_request.additions,
    deletions: pull_request.deletions,
    changedFiles: pull_request.changed_files,
    url: pull_request.html_url,
  });

  // Fetch the actual PR diff from GitHub API
  let prDiffText = null;
  try {
    const prDiffResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/pulls/${pull_request.number}`, {
      headers: {
        'Accept': 'application/vnd.github.v3.diff',
        'User-Agent': 'PM-Webhook-Bot'
      }
    });
    
    if (prDiffResponse.ok) {
      prDiffText = await prDiffResponse.text();
      console.log(`🔍 PR DIFF for #${pull_request.number}:`);
      console.log('=====================================');
      console.log(prDiffText);
      console.log('=====================================');
    }
  } catch (error) {
    console.log(`❌ Failed to fetch PR diff for #${pull_request.number}:`, error);
    
    // Create fallback diff for PRs
    prDiffText = `Pull Request: ${pull_request.title}
Author: ${pull_request.user.login}
PR #${pull_request.number}
State: ${pull_request.state}${pull_request.draft ? ' (draft)' : ''}
Base: ${pull_request.base.ref} ← Head: ${pull_request.head.ref}

Changes:
+${pull_request.additions} additions
-${pull_request.deletions} deletions
${pull_request.changed_files} files changed

GitHub URL: ${pull_request.html_url}

Note: Full diff not available (private repo requires authentication)`;
  }

  // Find the project
  const project = await findProjectByRepo(repository.full_name);
  if (!project) {
    console.log(`⚠️ No project found for repository: ${repository.full_name} - but logged PR data above`);
    return;
  }

  // Extract ticket references from PR title and body
  const ticketRefs = extractTicketReferences(
    `${pull_request.title} ${pull_request.body || ''}`
  );
  
  // Find referenced tickets
  const referencedTickets = await findTicketsByReferences(project.id, ticketRefs);
  
  // Create branch URL (approximate)
  const branchUrl = `https://github.com/${repository.full_name}/tree/${pull_request.head.ref}`;
  
  // Find or create the branch
  const branch = await findOrCreateBranch(
    project.id,
    pull_request.head.ref,
    branchUrl,
    pull_request.user.login,
    pull_request.user.email
  );

  // Create or update the pull request
  const prData = {
    projectId: project.id,
    githubId: pull_request.number,
    title: pull_request.title,
    body: pull_request.body,
    state: pull_request.draft ? 'draft' : pull_request.state,
    merged: pull_request.merged,
    author: pull_request.user.login,
    authorEmail: pull_request.user.email,
    url: pull_request.html_url,
    diff: prDiffText, // Store the PR diff
    baseBranch: pull_request.base.ref,
    additions: pull_request.additions,
    deletions: pull_request.deletions,
    changedFiles: pull_request.changed_files,
    branchId: branch.id,
    ticketId: referencedTickets[0]?.id || null, // Link to first found ticket
  };

  const existingPR = await prisma.pullRequest.findUnique({
    where: {
      projectId_githubId: {
        projectId: project.id,
        githubId: pull_request.number,
      },
    },
  });

  let pr;
  if (existingPR) {
    pr = await prisma.pullRequest.update({
      where: { id: existingPR.id },
      data: prData,
    });
  } else {
    pr = await prisma.pullRequest.create({
      data: prData,
    });

    // Auto-generate AI analysis for new PRs
    if (prDiffText && prDiffText.length > 200 && action === 'opened') { // Only analyze when PR is opened
      try {
        console.log(`🤖 Auto-analyzing PR: ${pull_request.title}`);
        
        // Set status to "analyzing"
        await prisma.pullRequest.update({
          where: { id: pr.id },
          data: { aiAnalysisStatus: 'analyzing' }
        });
        
        // Import AI analysis function
        const { analyzePR } = await import('@/lib/ai-analysis');
        
        // Get project context
        const projectContext = `${project.name}: ${project.description || 'No description'}`;
        
        // Get commit messages (empty array for now, could be enhanced)
        const commitMessages = [`Initial PR: ${pull_request.title}`];
        
        // Generate AI analysis
        const analysis = await analyzePR(
          pull_request.title, 
          pull_request.body, 
          prDiffText, 
          commitMessages, 
          projectContext
        );
        
        // Update PR with AI analysis and completed status
        await prisma.pullRequest.update({
          where: { id: pr.id },
          data: { 
            aiAnalysis: JSON.stringify(analysis),
            aiAnalysisStatus: 'completed'
          }
        });
        
        console.log(`✅ AI analysis completed for PR: ${pull_request.number}`);
        
        // Log AI analysis audit event
        await logAuditEvent({
          userId: 'system',
          projectId: project.id,
          header: 'PR AI Analysis Generated',
          description: `Auto-generated AI analysis for PR: ${analysis.summary}`,
        });
        
      } catch (error) {
        console.error(`❌ AI analysis failed for PR ${pull_request.number}:`, error);
        
        // Set status to "failed"
        await prisma.pullRequest.update({
          where: { id: pr.id },
          data: { aiAnalysisStatus: 'failed' }
        });
      }
    }
  }

  // Log audit event
  const actionText = action === 'opened' ? 'opened' 
                   : action === 'closed' && pull_request.merged ? 'merged'
                   : action === 'closed' ? 'closed'
                   : action === 'ready_for_review' ? 'marked ready for review'
                   : action === 'converted_to_draft' ? 'converted to draft'
                   : 'updated';

  await logAuditEvent({
    userId: 'system', // GitHub webhook user
    projectId: project.id,
    header: `Pull Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
    description: `PR #${pull_request.number} "${pull_request.title}" ${actionText}${referencedTickets.length > 0 ? ` (linked to ${referencedTickets.map(t => t.name).join(', ')})` : ''}`,
  });

  // Auto-update ticket status based on PR state
  if (referencedTickets.length > 0 && action === 'closed' && pull_request.merged) {
    for (const ticket of referencedTickets) {
      if (ticket.ticketStatus !== 'done') {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { ticketStatus: 'done' },
        });

        await logAuditEvent({
          userId: 'system',
          projectId: project.id,
          header: 'Ticket Auto-Completed',
          description: `Ticket "${ticket.name}" marked as done (PR #${pull_request.number} merged)`,
        });
      }
    }
  }

  console.log(`✅ Processed PR #${pull_request.number}: ${pull_request.title}`);
}

// Handle push events (commits)
async function handlePush(payload: GitHubPushPayload) {
  const { ref, commits, repository } = payload;
  
  // Skip if no commits or if it's a tag push
  if (!commits || commits.length === 0 || !ref.startsWith('refs/heads/')) {
    return;
  }

  const branchName = ref.replace('refs/heads/', '');
  
  // Log the full push data for debugging
  console.log(`🔍 Full Push Data:`, {
    branch: branchName,
    commitCount: commits.length,
    commits: commits.map(c => ({
      id: c.id.substring(0, 7),
      message: c.message.split('\n')[0], // first line only
      author: c.author.name,
      additions: c.added.length + c.modified.length,
      deletions: c.removed.length,
      url: c.url,
    })),
  });
  
  // Find the project
  const project = await findProjectByRepo(repository.full_name);
  if (!project) {
    console.log(`⚠️ No project found for repository: ${repository.full_name} - but logged push data above`);
    return;
  }

  // Create branch URL
  const branchUrl = `https://github.com/${repository.full_name}/tree/${branchName}`;
  
  // Find or create the branch
  const branch = await findOrCreateBranch(
    project.id,
    branchName,
    branchUrl,
    commits[0]?.author.name || 'Unknown',
    commits[0]?.author.email
  );

  // Process each commit
  console.log(`🔍 PROCESSING ${commits.length} COMMITS`);
  for (const commit of commits) {
    // Try to fetch commit diff from GitHub API
    let commitDiff = null;
    
    // First try: Individual commit API
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3.diff',
        'User-Agent': 'PM-Webhook-Bot'
      };
      
      // Add auth token if available
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }
      
      const commitResponse = await fetch(`https://api.github.com/repos/${repository.full_name}/commits/${commit.id}`, {
        headers
      });
      
      if (commitResponse.ok) {
        commitDiff = await commitResponse.text();
        console.log(`✅ Got diff for commit ${commit.id} (${commitDiff.length} chars)`);
      } else {
        console.log(`⚠️ Individual commit API failed (${commitResponse.status}), trying compare API...`);
        
        // Second try: Use the compare URL from webhook payload
        if (payload.compare) {
          const compareResponse = await fetch(`${payload.compare}.diff`, {
            headers: {
              'User-Agent': 'PM-Webhook-Bot'
            }
          });
          
          if (compareResponse.ok) {
            const fullDiff = await compareResponse.text();
            console.log(`✅ Got compare diff (${fullDiff.length} chars)`);
            
            // Extract this specific commit's changes from the full diff
            // For now, use the full diff since it might contain all changes
            commitDiff = `Full Push Diff (${payload.commits.length} commits):\n\n${fullDiff}`;
          } else {
            console.log(`⚠️ Compare API also failed (${compareResponse.status}), using enhanced fallback`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Failed to fetch any diff for commit ${commit.id}:`, error);
    }
    
    // Enhanced fallback with more details
    if (!commitDiff) {
      commitDiff = `Commit: ${commit.message}
Author: ${commit.author.name} <${commit.author.email}>
SHA: ${commit.id}
Timestamp: ${commit.timestamp}

Files changed: ${commit.added.length + commit.modified.length + commit.removed.length}

${commit.added.length > 0 ? `Added files (${commit.added.length}):\n${commit.added.map(f => `+ ${f}`).join('\n')}\n\n` : ''}${commit.modified.length > 0 ? `Modified files (${commit.modified.length}):\n${commit.modified.map(f => `~ ${f}`).join('\n')}\n\n` : ''}${commit.removed.length > 0 ? `Removed files (${commit.removed.length}):\n${commit.removed.map(f => `- ${f}`).join('\n')}\n\n` : ''}GitHub URL: ${commit.url}
Compare URL: ${payload.compare}

Note: Full diff not available (private repo requires authentication)`;
    }

    // Extract ticket references from commit message
    const ticketRefs = extractTicketReferences(commit.message);
    const referencedTickets = await findTicketsByReferences(project.id, ticketRefs);

    // Calculate file changes
    const additions = commit.added.length + commit.modified.length;
    const deletions = commit.removed.length;
    const changedFiles = commit.added.length + commit.modified.length + commit.removed.length;

    // Create or update commit
    const commitData = {
      projectId: project.id,
      githubId: commit.id,
      message: commit.message,
      author: commit.author.name,
      authorEmail: commit.author.email,
      url: commit.url,
      diff: commitDiff,
      additions,
      deletions,
      changedFiles,
      branchId: branch.id,
      ticketId: referencedTickets[0]?.id || null,
    };

    const existingCommit = await prisma.commit.findUnique({
      where: {
        projectId_githubId: {
          projectId: project.id,
          githubId: commit.id,
        },
      },
    });

    if (!existingCommit) {
      const newCommit = await prisma.commit.create({
        data: commitData,
      });

      // Notify connected clients about new commit
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/github-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'commit',
            projectId: project.id,
            data: { 
              id: newCommit.id,
              message: commit.message,
              author: commit.author.name,
              additions,
              deletions,
              changedFiles
            }
          })
        });
      } catch (error) {
        console.log('Failed to notify clients:', error);
      }

      // Auto-generate AI analysis for new commits
      if (commitDiff && commitDiff.length > 100) { // Only analyze substantial commits
        try {
          console.log(`🤖 Auto-analyzing commit: ${commit.message.split('\n')[0]}`);
          
          // Set status to "analyzing"
          await prisma.commit.update({
            where: { id: newCommit.id },
            data: { aiAnalysisStatus: 'analyzing' }
          });
          
          // Import AI analysis function
          const { analyzeCommit } = await import('@/lib/ai-analysis');
          
          // Get project context
          const projectContext = `${project.name}: ${project.description || 'No description'}`;
          
          // Generate AI analysis
          const analysis = await analyzeCommit(commit.message, commitDiff, projectContext);
          
          // Update commit with AI analysis and completed status
          await prisma.commit.update({
            where: { id: newCommit.id },
            data: { 
              aiAnalysis: JSON.stringify(analysis),
              aiAnalysisStatus: 'completed'
            }
          });
          
          console.log(`✅ AI analysis completed for commit: ${commit.id}`);
          
          // Notify clients about completed AI analysis
          try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/github-notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'analysis_complete',
                projectId: project.id,
                data: { 
                  id: newCommit.id,
                  type: 'commit',
                  summary: analysis.summary
                }
              })
            });
          } catch (error) {
            console.log('Failed to notify clients about analysis:', error);
          }
          
          // Log AI analysis audit event
          await logAuditEvent({
            userId: 'system',
            projectId: project.id,
            header: 'AI Analysis Generated',
            description: `Auto-generated AI analysis for commit: ${analysis.summary}`,
          });
          
        } catch (error) {
          console.error(`❌ AI analysis failed for commit ${commit.id}:`, error);
          
          // Set status to "failed"
          await prisma.commit.update({
            where: { id: newCommit.id },
            data: { aiAnalysisStatus: 'failed' }
          });
        }
      }

      // Log audit event for significant commits (not tiny changes)
      if (additions + deletions > 5) {
        await logAuditEvent({
          userId: 'system',
          projectId: project.id,
          header: 'Commit Pushed',
          description: `${commit.author.name} pushed "${commit.message.split('\n')[0]}" to ${branchName}${referencedTickets.length > 0 ? ` (linked to ${referencedTickets.map(t => t.name).join(', ')})` : ''}`,
        });
      }
    }
  }

  console.log(`✅ Processed ${commits.length} commits on ${branchName}`);
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // JSON payload
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Form-encoded payload (GitHub's default)
      const formData = await request.text();
      const params = new URLSearchParams(formData);
      const payloadString = params.get('payload');
      if (!payloadString) {
        throw new Error('No payload found in form data');
      }
      body = JSON.parse(payloadString);
    } else {
      // Try JSON as fallback
      body = await request.json();
    }
    
    const eventType = request.headers.get('x-github-event') as GitHubWebhookEvent;

    console.log(`📥 GitHub webhook: ${eventType}`, {
      action: body.action,
      repo: body.repository?.full_name,
    });

    // Log the ENTIRE payload for debugging
    console.log('🔍 FULL WEBHOOK PAYLOAD:', JSON.stringify(body, null, 2));

    switch (eventType) {
      case 'pull_request':
        await handlePullRequest(body as GitHubPullRequestPayload);
        break;
        
      case 'push':
        await handlePush(body as GitHubPushPayload);
        break;
        
      default:
        console.log(`ℹ️ Ignoring event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'GitHub webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
}
