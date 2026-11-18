import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { isValidPublicId } from './security';
import { config } from './config';
import { db } from './db';

export const wsClients = new Map<string, Set<WebSocket>>();
const wsIpCounts = new Map<string, number>();

const MAX_TOTAL_WS = 1000;
const MAX_WS_PER_IP = 30;
let totalConnections = 0;

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

function isAllowedOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  if (config.production) return origin === config.publicBaseUrl;
  if (!origin) return true;
  const host = request.headers.host;
  if (!host) return false;
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

const heartbeatInterval = setInterval(() => {
  for (const [publicId, clients] of wsClients.entries()) {
    for (const ws of clients) {
      const alive = (ws as any)._isAlive;
      if (alive === false) {
        ws.terminate();
        continue;
      }
      (ws as any)._isAlive = false;
      try { ws.ping(); } catch {}
    }
    if (clients.size === 0) {
      wsClients.delete(publicId);
    }
  }
}, 30_000);
heartbeatInterval.unref();

export function setupWebSocket(wss: WebSocketServer, request: IncomingMessage, socket: Duplex, head: Buffer) {
  try {
    const protocol = request.headers['sec-websocket-protocol'];
    if (protocol === 'vite-hmr' || protocol === 'vite-ping') {
      return;
    }

    if (!isAllowedOrigin(request)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    const host = request.headers.host || 'localhost';
    const hostname = host.replace(/:\d+$/, '').toLowerCase();
    if (config.production && !config.allowedHosts.includes(hostname)) { socket.destroy(); return; }
    const url = new URL(request.url || '', `http://${host}`);
    const match = url.pathname.match(/^\/api\/ws\/([^/]+)$/);
    if (!match || !isValidPublicId(match[1])) {
      socket.destroy();
      return;
    }

    const ip = String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const ipCount = wsIpCounts.get(ip) || 0;
    if (totalConnections >= MAX_TOTAL_WS || ipCount >= MAX_WS_PER_IP) {
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    const publicId = match[1];
    if (!db.sessions.some(s => s.public_id === publicId) && !db.polls.some(p => p.public_id === publicId)) {
      socket.destroy(); return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      if (!wsClients.has(publicId)) {
        wsClients.set(publicId, new Set());
      }
      wsClients.get(publicId)!.add(ws);
      totalConnections++;
      wsIpCounts.set(ip, (wsIpCounts.get(ip) || 0) + 1);
      (ws as any)._isAlive = true;

      ws.on('pong', () => {
        (ws as any)._isAlive = true;
      });

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        const set = wsClients.get(publicId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) wsClients.delete(publicId);
        }
        totalConnections = Math.max(0, totalConnections - 1);
        const cur = (wsIpCounts.get(ip) || 1) - 1;
        if (cur <= 0) wsIpCounts.delete(ip);
        else wsIpCounts.set(ip, cur);
      };

      ws.on('error', cleanup);
      ws.on('close', cleanup);
    });
  } catch {
    socket.destroy();
  }
}
