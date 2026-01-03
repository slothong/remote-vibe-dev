import {useState} from 'react';
import {SSHConnectionForm} from './components/ssh-connection-form';
import {Terminal} from './components/terminal';
import {Checklist} from './components/checklist';
import {connectToSSH} from './services/ssh-service';

function App() {
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleConnect = async (data: {
    host: string;
    port: number;
    username: string;
    authMethod: 'password' | 'key';
    password?: string;
    privateKeyFile?: File;
  }) => {
    const result = await connectToSSH(data);

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      return {success: true};
    }

    return {
      success: false,
      error: result.error,
    };
  };

  const handleSuccess = () => {
    setConnected(true);
  };

  if (connected) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-5">
          <h1 className="text-2xl font-bold">Connected to SSH</h1>
          <p className="text-gray-600">Session ID: {sessionId}</p>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-96 p-5 border-r border-gray-300 overflow-y-auto">
            <Checklist sessionId={sessionId || undefined} />
          </div>
          <div className="flex-1">
            <Terminal sessionId={sessionId || undefined} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SSHConnectionForm onConnect={handleConnect} onSuccess={handleSuccess} />
    </div>
  );
}

export default App;
