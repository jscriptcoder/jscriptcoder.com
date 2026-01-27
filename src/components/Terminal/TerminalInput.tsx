import { useRef, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onTab: () => void;
  passwordMode?: boolean;
}

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onTab,
  passwordMode = false,
}: TerminalInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { getPrompt } = useSession();

  // Focus input on mount and when clicking anywhere
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onSubmit();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!passwordMode) onHistoryUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!passwordMode) onHistoryDown();
        break;
      case 'Tab':
        e.preventDefault();
        if (!passwordMode) onTab();
        break;
    }
  };

  // Mask value with asterisks in password mode
  const displayValue = passwordMode ? '*'.repeat(value.length) : value;
  const prompt = passwordMode ? '' : getPrompt();

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex items-center p-4 border-t border-amber-900/30"
      onClick={handleContainerClick}
    >
      {prompt && <span className="text-amber-300 mr-2">{prompt}</span>}
      <div className="flex-1 relative">
        {/* Hidden input for capturing keystrokes */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
          style={{ color: 'transparent', caretColor: 'transparent' }}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
        {/* Visible display */}
        <span className="text-amber-400">{displayValue}</span>
        <span className="animate-pulse text-amber-400">_</span>
      </div>
    </div>
  );
};
