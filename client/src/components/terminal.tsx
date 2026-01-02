import {useEffect, useRef} from 'react';
import {Terminal as XTerm} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export function Terminal() {
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

    // Cleanup
    return () => {
      term.dispose();
    };
  }, []);

  return (
    <div
      data-testid="terminal-container"
      className="terminal-container"
      style={{position: 'fixed', bottom: '0', width: '100%', height: '300px'}}
    >
      <div ref={terminalRef} style={{width: '100%', height: '100%'}} />
    </div>
  );
}
