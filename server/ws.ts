import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

export const wsClients = new Map<string, Set<WebSocket>>();

export function broadcastSession(publicId: string, event: string) {
  const clients = wsClients.get(publicId);
  if (clients) {
    const payload = JSON.stringify({ event, timestamp: Date.now() });
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

export function setupWebSocket(wss: WebSocketServer, request: IncomingMessage, socket: Duplex, head: Buffer) {
  try {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);
    const match = url.pathname.match(/^\/api\/ws\/(.+)$/);
    if (match) {
      const publicId = match[1];
      wss.handleUpgrade(request, socket, head, (ws) => {
        if (!wsClients.has(publicId)) {
          wsClients.set(publicId, new Set());
        }
        wsClients.get(publicId)!.add(ws);

        ws.on('error', () => {
          wsClients.get(publicId)?.delete(ws);
        });

        ws.on('close', () => {
          wsClients.get(publicId)?.delete(ws);
        });
      });
      return;
    }

    // In production, reject any non-session WebSocket requests
    if (process.env.NODE_ENV === 'production') {
      socket.destroy();
    }
  } catch {
    socket.destroy();
  }
}
