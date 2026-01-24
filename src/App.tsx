import { Terminal } from './components/Terminal';
import { SessionProvider } from './context/SessionContext';

function App() {
  return (
    <SessionProvider>
      <Terminal />
    </SessionProvider>
  );
}

export default App;
