import { useRef, useEffect } from 'react';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onTab: () => void;
}

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onTab,
}: TerminalInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

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
        onHistoryUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onHistoryDown();
        break;
      case 'Tab':
        e.preventDefault();
        onTab();
        break;
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex items-center p-4 border-t border-amber-900/30"
      onClick={handleContainerClick}
    >
      <span className="text-amber-300 mr-2">&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-amber-400 outline-none caret-amber-400"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
      />
    </div>
  );
};
