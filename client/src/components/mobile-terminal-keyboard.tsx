interface MobileTerminalKeyboardProps {
  onKeyPress: (key: string) => void;
}

export function MobileTerminalKeyboard({
  onKeyPress,
}: MobileTerminalKeyboardProps) {
  const buttonClass =
    'px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 active:bg-gray-500 min-w-[60px] text-center font-medium';

  return (
    <div className="flex gap-2 p-2 bg-gray-800 border-b border-gray-700 overflow-x-auto">
      <button
        aria-label="Up"
        onClick={() => onKeyPress('\x1b[A')}
        className={buttonClass}
      >
        ↑
      </button>
      <button
        aria-label="Down"
        onClick={() => onKeyPress('\x1b[B')}
        className={buttonClass}
      >
        ↓
      </button>
      <button
        aria-label="Left"
        onClick={() => onKeyPress('\x1b[D')}
        className={buttonClass}
      >
        ←
      </button>
      <button
        aria-label="Right"
        onClick={() => onKeyPress('\x1b[C')}
        className={buttonClass}
      >
        →
      </button>
      <button
        aria-label="ESC"
        onClick={() => onKeyPress('\x1b')}
        className={buttonClass}
      >
        ESC
      </button>
      <button
        aria-label="Enter"
        onClick={() => onKeyPress('\r')}
        className={buttonClass}
      >
        Enter
      </button>
    </div>
  );
}
