import {useEffect, useRef} from 'react';
import {Terminal as XTerm} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {initWebSocket, closeWebSocket} from '../services/websocket-manager';

interface TerminalProps {
  sessionId?: string;
}

export function Terminal({sessionId}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'monospace',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket if sessionId is provided
    if (sessionId) {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      const ws = initWebSocket(wsUrl);

      ws.onopen = () => {
        term.writeln('Connected to server');

        // Start shell session
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ssh/shell`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({sessionId}),
        })
          .then(res => res.json())
          .then((data: {success: boolean; error?: string}) => {
            if (data.success) {
              term.writeln('Shell session started');
            } else {
              term.writeln(`Error: ${data.error}`);
            }
          })
          .catch((err: Error) => {
            term.writeln(`Error starting shell: ${err.message}`);
          });
      };

      ws.onmessage = event => {
        term.write(event.data);
      };

      ws.onerror = () => {
        term.writeln('\r\nWebSocket error occurred');
      };

      ws.onclose = () => {
        term.writeln('\r\nDisconnected from server');
      };

      // Send terminal input to WebSocket
      term.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }

    // Cleanup
    return () => {
      closeWebSocket();
      term.dispose();
    };
  }, [sessionId]);

  return (
    <div
      data-testid="terminal-container"
      className="terminal-container w-full h-full bg-gray-900 flex flex-col"
    >
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-gray-300">Terminal</span>
        </div>
      </div>
      <div ref={terminalRef} className="w-full h-full p-2" />
    </div>
  );
}
