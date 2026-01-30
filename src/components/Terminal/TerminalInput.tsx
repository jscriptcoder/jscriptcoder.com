import { useRef, useEffect, useState, useCallback } from 'react';
import { useSession } from '../../context/SessionContext';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onTab: () => void;
  passwordMode?: boolean;
  disabled?: boolean;
}

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onTab,
  passwordMode = false,
  disabled = false,
}: TerminalInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const isUserInput = useRef(false);
  const { getPrompt } = useSession();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    setIsFocused(true);
  }, []);

  // Update cursor position when value changes externally (e.g., history navigation, autocomplete)
  useEffect(() => {
    if (!isUserInput.current) {
      // External change - move cursor to end
      setCursorPosition(value.length);
      if (inputRef.current) {
        inputRef.current.selectionStart = value.length;
        inputRef.current.selectionEnd = value.length;
      }
    }
    isUserInput.current = false;
  }, [value]);

  const updateCursorPosition = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart ?? value.length);
    }
  }, [value.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
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
      default:
        // Update cursor position after the key event is processed
        setTimeout(updateCursorPosition, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    isUserInput.current = true;
    onChange(e.target.value);
    // Update cursor position after change
    setTimeout(updateCursorPosition, 0);
  };

  // Mask value with asterisks in password mode
  const displayValue = passwordMode ? '*'.repeat(value.length) : value;
  const prompt = passwordMode ? '' : getPrompt();

  // Split display value at cursor position
  const beforeCursor = displayValue.slice(0, cursorPosition);
  const afterCursor = displayValue.slice(cursorPosition);

  const handleContainerClick = () => {
    inputRef.current?.focus();
    // Update cursor position after focus
    setTimeout(updateCursorPosition, 0);
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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={updateCursorPosition}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
          style={{ color: 'transparent', caretColor: 'transparent' }}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
        {/* Visible display with cursor at correct position */}
        <span className="text-amber-400">{beforeCursor}</span>
        {isFocused && !disabled && <span className="animate-pulse inline-block w-2 h-4 bg-amber-400 align-middle" />}
        <span className="text-amber-400">{afterCursor}</span>
      </div>
    </div>
  );
};
