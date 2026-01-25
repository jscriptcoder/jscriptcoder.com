import { Terminal } from './components/Terminal';
import { SessionProvider } from './context/SessionContext';
import { FileSystemProvider } from './filesystem';

function App() {
  return (
    <SessionProvider>
      <FileSystemProvider>
        <Terminal />
      </FileSystemProvider>
    </SessionProvider>
  );
}

export default App;
