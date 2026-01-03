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
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SSH Remote Development</h1>
              <p className="text-blue-100 text-sm mt-1">
                Connected • Session:{' '}
                <span className="font-mono text-xs">{sessionId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
            <div className="p-6">
              <Checklist sessionId={sessionId || undefined} />
            </div>
          </div>
          <div className="flex-1 bg-gray-900">
            <Terminal sessionId={sessionId || undefined} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <SSHConnectionForm onConnect={handleConnect} onSuccess={handleSuccess} />
    </div>
  );
}

export default App;
