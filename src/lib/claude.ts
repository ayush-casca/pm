import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TicketSuggestion {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedAssigneeRole: 'engineer' | 'pm' | 'admin' | 'any';
  reasoning: string;
  citations: Array<{
    text: string;
    timestamp: string;
    context: string;
  }>;
}

export interface TranscriptAnalysis {
  summary: string;
  keyTopics: string[];
  actionItems: TicketSuggestion[];
}

export async function analyzeTranscriptWithClaude(
  transcriptName: string,
  transcriptContent: string,
  projectUsers: Array<{ user: { id: string; name: string | null; email: string }; role: string }>
): Promise<TranscriptAnalysis> {
  const userContext = projectUsers.map(pu => 
    `- ${pu.user.name || pu.user.email} (${pu.role})`
  ).join('\n');

  const prompt = `You are analyzing a meeting transcript to extract actionable tickets for a project management system.

TRANSCRIPT NAME: ${transcriptName}

PROJECT TEAM:
${userContext}

TRANSCRIPT CONTENT:
${transcriptContent}

Please analyze this transcript and extract actionable tickets. For each ticket, determine:
1. A clear, specific name (keep it concise)
2. A detailed description of what needs to be done
3. Priority level (high/medium/low) based on urgency and impact
4. Best role to assign it to (engineer/pm/admin/any)
5. Brief reasoning for the assignment

Focus on concrete, actionable items that can be tracked and completed. Avoid vague or discussion-only items.

For each ticket, include specific citations with literal quotes from the transcript and timestamps if available. These citations should explain WHY this became a ticket.

Respond with a JSON object in this exact format:
{
  "summary": "Brief 2-3 sentence summary of the meeting",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "actionItems": [
    {
      "name": "Ticket name",
      "description": "Detailed description of what needs to be done",
      "priority": "high|medium|low",
      "suggestedAssigneeRole": "engineer|pm|admin|any",
      "reasoning": "Why this role and priority",
      "citations": [
        {
          "text": "Exact quote from transcript that led to this ticket",
          "timestamp": "12:33 or exact timestamp if available",
          "context": "Brief context of why this quote is relevant"
        }
      ]
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fastest Claude model
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const analysis = JSON.parse(content.text) as TranscriptAnalysis;
    
    // Validate the response structure
    if (!analysis.summary || !Array.isArray(analysis.keyTopics) || !Array.isArray(analysis.actionItems)) {
      throw new Error('Invalid response structure from Claude');
    }

    return analysis;
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Fallback to mock analysis if Claude fails
    return {
      summary: `Analysis of "${transcriptName}" - Claude API temporarily unavailable, using fallback analysis.`,
      keyTopics: ['API Integration', 'Error Handling', 'Fallback Processing'],
      actionItems: [
        {
          name: 'Investigate Claude API connection',
          description: 'Debug the Claude API integration to ensure proper connectivity and error handling.',
          priority: 'high',
          suggestedAssigneeRole: 'engineer',
          reasoning: 'Technical issue requiring engineering expertise'
        },
        {
          name: 'Review transcript processing',
          description: 'Manual review of the transcript content to extract action items.',
          priority: 'medium',
          suggestedAssigneeRole: 'pm',
          reasoning: 'Requires project management skills to identify actionable items'
        }
      ]
    };
  }
}
