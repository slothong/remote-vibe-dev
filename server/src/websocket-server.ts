import {WebSocketServer, type WebSocket} from 'ws';
import type {Server} from 'http';

export class WebSocketBridge {
  private wss: WebSocketServer | null = null;
  private port?: number;
  private connectionHandlers: Array<() => void> = [];
  private disconnectionHandlers: Array<() => void> = [];
  private messageHandlers: Array<(message: string) => void> = [];

  constructor(port?: number) {
    this.port = port;
  }

  async start(server?: Server): Promise<void> {
    return new Promise((resolve, reject) => {
      // If server is provided, attach to existing HTTP server
      // Otherwise create standalone WebSocket server on specified port
      if (server) {
        this.wss = new WebSocketServer({server});
        // Server is already listening, resolve immediately after setup
        this.setupConnectionHandlers();
        resolve();
      } else if (this.port) {
        this.wss = new WebSocketServer({port: this.port});

        this.wss.on('listening', () => {
          resolve();
        });

        this.wss.on('error', err => {
          reject(err);
        });

        this.setupConnectionHandlers();
      } else {
        reject(new Error('Either port or server must be provided'));
      }
    });
  }

  private setupConnectionHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req) => {
      // Extract sessionId from query parameters
      const url = new URL(req.url || '', 'ws://localhost');
      const sessionId = url.searchParams.get('sessionId');

      // Store sessionId in WebSocket object
      (ws as any).sessionId = sessionId;

      this.connectionHandlers.forEach(handler => handler());

      ws.on('message', (data: Buffer) => {
        const message = data.toString();
        this.messageHandlers.forEach(handler => handler(message));
      });

      ws.on('close', () => {
        this.disconnectionHandlers.forEach(handler => handler());
      });
    });
  }

  isListening(): boolean {
    return this.wss !== null && this.wss.clients.size >= 0;
  }

  async close(): Promise<void> {
    if (!this.wss) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.wss!.close(err => {
        if (err) {
          reject(err);
        } else {
          this.wss = null;
          resolve();
        }
      });
    });
  }

  getPort(): number | undefined {
    return this.port;
  }

  onConnection(handler: () => void): void {
    this.connectionHandlers.push(handler);
  }

  onDisconnection(handler: () => void): void {
    this.disconnectionHandlers.push(handler);
  }

  getClientCount(): number {
    if (!this.wss) {
      return 0;
    }
    return this.wss.clients.size;
  }

  onMessage(handler: (message: string) => void): void {
    this.messageHandlers.push(handler);
  }

  send(message: string): void {
    if (!this.wss) {
      return;
    }

    this.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    });
  }

  broadcast(message: string): void {
    this.send(message);
  }
}
