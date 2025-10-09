import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CommitAnalysis {
  summary: string;
  impact: string[];
  complexity: 'low' | 'medium' | 'high';
  businessValue?: string;
  suggestedTickets?: string[];
  codePatterns?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  fileTypes?: string[];
}

export interface PRAnalysis extends CommitAnalysis {
  overallGoal: string;
  testingNeeded: boolean;
  deploymentRisk: 'low' | 'medium' | 'high';
  estimatedReviewTime: string;
}

export async function analyzeCommit(
  commitMessage: string,
  diff: string,
  projectContext?: string
): Promise<CommitAnalysis> {
  try {
    const prompt = `
You are a senior software engineer analyzing a git commit for a project management system.

Project Context: ${projectContext || 'Web application with React/Next.js frontend and database'}

Commit Message: ${commitMessage}

Diff (first 3000 chars):
${diff.substring(0, 3000)}

Analyze this commit and provide a JSON response with:
{
  "summary": "Non-technical explanation of what this change does (1-2 sentences)",
  "impact": ["List of file paths or components affected"],
  "complexity": "low|medium|high - based on code complexity and scope",
  "businessValue": "What business value this provides (optional)",
  "suggestedTickets": ["Any follow-up work that might be needed"],
  "codePatterns": ["React components", "API endpoints", "database changes", etc.],
  "riskLevel": "low|medium|high - deployment/breaking change risk",
  "fileTypes": ["tsx", "ts", "sql", etc.]
}

Focus on:
- What the user/business gets from this change
- Which parts of the system are touched
- Potential risks or follow-up work needed
- Keep explanations simple and non-technical
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are a senior software engineer who explains code changes in business terms. Always respond with valid JSON only.

${prompt}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const analysis = JSON.parse(content.text) as CommitAnalysis;
    return analysis;
  } catch (error) {
    console.error('Error analyzing commit:', error);
    // Return a fallback analysis
    return {
      summary: 'Code changes were made but analysis failed',
      impact: ['Unknown files'],
      complexity: 'medium',
      riskLevel: 'medium',
      codePatterns: ['Unknown'],
    };
  }
}

export async function analyzePR(
  prTitle: string,
  prBody: string | null,
  diff: string,
  commitMessages: string[],
  projectContext?: string
): Promise<PRAnalysis> {
  try {
    const prompt = `
You are a senior software engineer analyzing a GitHub Pull Request for a project management system.

Project Context: ${projectContext || 'Web application with React/Next.js frontend and database'}

PR Title: ${prTitle}
PR Description: ${prBody || 'No description provided'}

Commit Messages:
${commitMessages.join('\n')}

Diff (first 5000 chars):
${diff.substring(0, 5000)}

Analyze this PR and provide a JSON response with:
{
  "summary": "Non-technical explanation of what this PR accomplishes",
  "overallGoal": "The main business objective of this PR",
  "impact": ["List of major components/areas affected"],
  "complexity": "low|medium|high",
  "businessValue": "What business value this provides",
  "testingNeeded": true/false,
  "deploymentRisk": "low|medium|high",
  "estimatedReviewTime": "5 minutes|30 minutes|2 hours|etc.",
  "suggestedTickets": ["Follow-up work needed"],
  "codePatterns": ["Types of changes made"],
  "riskLevel": "low|medium|high",
  "fileTypes": ["File extensions involved"]
}

Focus on the big picture - what is this PR trying to achieve for the business/users?
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are a senior software engineer who explains code changes in business terms. Always respond with valid JSON only.

${prompt}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const analysis = JSON.parse(content.text) as PRAnalysis;
    return analysis;
  } catch (error) {
    console.error('Error analyzing PR:', error);
    // Return a fallback analysis
    return {
      summary: 'Pull request changes were made but analysis failed',
      overallGoal: 'Unknown objective',
      impact: ['Unknown components'],
      complexity: 'medium',
      businessValue: 'Unknown business value',
      testingNeeded: true,
      deploymentRisk: 'medium',
      estimatedReviewTime: '30 minutes',
      riskLevel: 'medium',
      codePatterns: ['Unknown'],
    };
  }
}

export async function analyzeCodebaseStructure(
  fileList: string[],
  packageJson?: any,
  readmeContent?: string
): Promise<{
  projectType: string;
  mainTechnologies: string[];
  architecture: string;
  businessDomain: string;
  keyComponents: string[];
}> {
  try {
    const prompt = `
Analyze this codebase structure to understand the project:

Files: ${fileList.slice(0, 100).join(', ')}
Package.json dependencies: ${packageJson ? Object.keys(packageJson.dependencies || {}).join(', ') : 'Unknown'}
README: ${readmeContent?.substring(0, 1000) || 'No README'}

Provide JSON response:
{
  "projectType": "e-commerce|saas|blog|dashboard|api|etc.",
  "mainTechnologies": ["React", "Next.js", "PostgreSQL", etc.],
  "architecture": "Description of the architecture pattern",
  "businessDomain": "What business problem this solves",
  "keyComponents": ["auth", "payments", "user-management", etc.]
}
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: `You are a senior architect analyzing codebases. Respond with valid JSON only.

${prompt}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return JSON.parse(content.text);
  } catch (error) {
    console.error('Error analyzing codebase structure:', error);
    return {
      projectType: 'web-application',
      mainTechnologies: ['JavaScript', 'React'],
      architecture: 'Standard web application',
      businessDomain: 'Unknown',
      keyComponents: ['frontend', 'backend'],
    };
  }
}
