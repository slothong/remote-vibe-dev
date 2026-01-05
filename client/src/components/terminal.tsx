import {useEffect, useRef} from 'react';
import {Terminal as XTerm} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {Unicode11Addon} from '@xterm/addon-unicode11';
import '@xterm/xterm/css/xterm.css';
import {initWebSocket, setWebSocket, closeWebSocket} from '../services/websocket-manager';

interface TerminalProps {
  sessionId?: string;
}

export function Terminal({sessionId}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !sessionId) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'monospace',
      allowTransparency: false,
      // convertEol should be false to properly handle \r (carriage return)
      // This allows terminal to overwrite lines instead of creating new ones
      convertEol: false,
      rendererType: 'canvas',
      allowProposedApi: true,
      scrollback: 1000,
      windowsMode: false,
    });

    const fitAddon = new FitAddon();
    const unicode11Addon = new Unicode11Addon();

    term.open(terminalRef.current);
    term.loadAddon(fitAddon);
    term.loadAddon(unicode11Addon);

    // Enable Unicode 11 support if available
    if (term.unicode) {
      term.unicode.activeVersion = '11';
    }

    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Create a new WebSocket instance for this terminal with sessionId
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const wsUrlWithSession = `${wsUrl}?sessionId=${sessionId}`;
    const ws = initWebSocket(wsUrlWithSession);
    setWebSocket(ws);

    // Define event handlers
    const handleOpen = () => {
      term.writeln('Connected to server');

      // Start shell session with terminal size
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ssh/shell`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionId,
          cols: term.cols,
          rows: term.rows,
        }),
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

    const handleMessage = (event: MessageEvent) => {
      term.write(event.data);
    };

    const handleError = () => {
      term.writeln('\r\nWebSocket error occurred');
    };

    const handleClose = () => {
      term.writeln('\r\nDisconnected from server');
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);
    ws.addEventListener('close', handleClose);

    // Send terminal input to WebSocket
    const dataDisposable = term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Cleanup
    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('close', handleClose);
      dataDisposable.dispose();

      closeWebSocket();
      setWebSocket(null);

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
      <div ref={terminalRef} className="w-full h-full p-2 overflow-auto touch-pan-y" />
    </div>
  );
}
