import { Terminal } from './components/Terminal';
import { SessionProvider } from './context/SessionContext';
import { FileSystemProvider } from './filesystem';
import { NetworkProvider } from './network';

function App() {
  return (
    <SessionProvider>
      <FileSystemProvider>
        <NetworkProvider>
          <Terminal />
        </NetworkProvider>
      </FileSystemProvider>
    </SessionProvider>
  );
}

export default App;
