import type { OutputLine, AuthorData } from './types';

type TerminalOutputProps = {
  readonly lines: readonly OutputLine[];
};

const AuthorCard = ({ data }: { data: AuthorData }) => (
  <div className="flex items-start gap-6 py-4 pl-4 max-w-3xl">
    <img
      src={data.avatar}
      alt={data.name}
      className="w-[152px] h-[152px] rounded-full border-2 border-amber-500 shrink-0"
    />
    <div className="flex flex-col gap-2">
      <h2 className="text-amber-300 text-xl font-bold">{data.name}</h2>
      <div className="flex flex-col gap-3 text-amber-500">
        {data.description.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        {data.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-200 underline"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  </div>
);

const renderLine = (line: OutputLine) => {
  switch (line.type) {
    case 'banner':
      return <div className="text-amber-400">{line.content}</div>;
    case 'command':
      return (
        <div className="text-amber-400">
          <span className="text-amber-300">{line.prompt} </span>
          {line.content}
        </div>
      );
    case 'result':
      return <div className="text-amber-500 pl-4">{line.content || '\u00A0'}</div>;
    case 'error':
      return <div className="text-red-500 pl-4">{line.content}</div>;
    case 'author':
      return <AuthorCard data={line.content} />;
  }
};

export const TerminalOutput = ({ lines }: TerminalOutputProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {lines.map((line) => (
        <div
          key={line.id}
          className={
            line.type === 'banner'
              ? 'whitespace-pre'
              : line.type === 'author'
                ? 'break-words'
                : 'whitespace-pre-wrap break-all'
          }
        >
          {renderLine(line)}
        </div>
      ))}
    </div>
  );
};
