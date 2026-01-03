import {useEffect, useRef} from 'react';
import {Terminal as XTerm} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sessionId?: string;
}

export function Terminal({sessionId}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

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
      const ws = new WebSocket(wsUrl);

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

              // Execute claude command in remote-dev-workspace
              setTimeout(() => {
                // Change to remote-dev-workspace directory first
                const cdCommand = 'cd remote-dev-workspace\n';
                ws.send(cdCommand);

                // Then execute claude command
                setTimeout(() => {
                  const claudeCommand = 'claude\n';
                  ws.send(claudeCommand);
                }, 200);
              }, 500);
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

      wsRef.current = ws;
    }

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [sessionId]);

  return (
    <div
      data-testid="terminal-container"
      className="terminal-container"
      style={{width: '100%', height: '300px'}}
    >
      <div ref={terminalRef} style={{width: '100%', height: '100%'}} />
    </div>
  );
}
