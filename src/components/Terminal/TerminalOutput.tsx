import type { OutputLine } from './types';

interface TerminalOutputProps {
  lines: OutputLine[];
}

export const TerminalOutput = ({ lines }: TerminalOutputProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {lines.map((line) => (
        <div key={line.id} className={line.type === 'banner' ? 'whitespace-pre' : 'whitespace-pre-wrap break-all'}>
          {line.type === 'banner' && (
            <div className="text-amber-400">{line.content}</div>
          )}
          {line.type === 'command' && (
            <div className="text-amber-400">
              <span className="text-amber-300">&gt; </span>
              {line.content}
            </div>
          )}
          {line.type === 'result' && (
            <div className="text-amber-500 pl-4">{line.content}</div>
          )}
          {line.type === 'error' && (
            <div className="text-red-500 pl-4">{line.content}</div>
          )}
        </div>
      ))}
    </div>
  );
};
