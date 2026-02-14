import { useRef, useEffect, useState, useCallback } from 'react';
import { useSession } from '../../session/SessionContext';

type PromptMode = 'username' | 'password';

type TerminalInputProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onHistoryUp: () => void;
  readonly onHistoryDown: () => void;
  readonly onTab: () => void;
  readonly promptMode?: PromptMode;
  readonly disabled?: boolean;
  readonly externalInputRef?: React.RefObject<HTMLInputElement>;
};

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onTab,
  promptMode,
  disabled = false,
  externalInputRef,
}: TerminalInputProps) => {
  const isPromptMode = promptMode !== undefined;
  const shouldMaskInput = promptMode === 'password';
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  // Tracks whether the current value change originated from user typing (vs. external
  // updates like history navigation or autocomplete). When false, the useEffect below
  // moves the cursor to the end. Reset to false after every check so external changes
  // are the default assumption — only handleChange sets it true before calling onChange.
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
        if (!isPromptMode) onHistoryUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isPromptMode) onHistoryDown();
        break;
      case 'Tab':
        e.preventDefault();
        if (!isPromptMode) onTab();
        break;
      default:
        // setTimeout(fn, 0) defers until after the browser processes the keystroke
        // and updates selectionStart — reading it synchronously would get the old value
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
  const displayValue = shouldMaskInput ? '*'.repeat(value.length) : value;
  const prompt = isPromptMode ? '' : getPrompt();

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
        {/* Hidden native input captures keystrokes and clipboard events while a custom
            rendered cursor (the amber block below) provides the retro CRT aesthetic.
            Native caret styling can't achieve an animated block cursor. */}
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
        {isFocused && !disabled && (
          <span className="animate-pulse inline-block w-2 h-4 bg-amber-400 align-middle" />
        )}
        <span className="text-amber-400">{afterCursor}</span>
      </div>
    </div>
  );
};
