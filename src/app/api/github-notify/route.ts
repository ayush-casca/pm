import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for active connections
const activeConnections = new Set<ReadableStreamDefaultController>();

// Server-Sent Events endpoint for real-time GitHub updates
export async function GET(request: NextRequest) {
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to active connections
      activeConnections.add(controller);
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'GitHub updates stream connected' })}\n\n`);
      
      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
        } catch (error) {
          clearInterval(keepAlive);
          activeConnections.delete(controller);
        }
      }, 30000);

      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        activeConnections.delete(controller);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
    cancel() {
      // Clean up when stream is cancelled
    }
  });

  return new Response(stream, { headers });
}

// Function to notify all connected clients about GitHub updates
export function notifyGitHubUpdate(data: {
  type: 'commit' | 'pr' | 'analysis_complete';
  projectId: string;
  data: any;
}) {
  const message = `data: ${JSON.stringify({
    type: 'github_update',
    ...data,
    timestamp: Date.now()
  })}\n\n`;

  // Send to all active connections
  for (const controller of activeConnections) {
    try {
      controller.enqueue(message);
    } catch (error) {
      // Connection is closed, remove it
      activeConnections.delete(controller);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Notify all connected clients
    notifyGitHubUpdate(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GitHub notify error:', error);
    return NextResponse.json({ error: 'Failed to notify' }, { status: 500 });
  }
}
