let wsInstance: WebSocket | null = null;

export function getWebSocket(): WebSocket | null {
  return wsInstance;
}

export function initWebSocket(url: string): WebSocket {
  if (wsInstance && wsInstance.readyState !== WebSocket.CLOSED) {
    return wsInstance;
  }

  wsInstance = new WebSocket(url);
  return wsInstance;
}

export function closeWebSocket(): void {
  if (wsInstance) {
    wsInstance.close();
    wsInstance = null;
  }
}
