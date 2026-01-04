let wsInstance: WebSocket | null = null;

export function getWebSocket(): WebSocket | null {
  return wsInstance;
}

export function setWebSocket(ws: WebSocket | null): void {
  wsInstance = ws;
}

export function initWebSocket(url: string): WebSocket {
  // Always close existing connection before creating new one
  if (wsInstance) {
    if (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING) {
      wsInstance.close();
    }
    wsInstance = null;
  }

  wsInstance = new WebSocket(url);
  return wsInstance;
}

export function closeWebSocket(): void {
  if (wsInstance) {
    if (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING) {
      wsInstance.close();
    }
    wsInstance = null;
  }
}
