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
        {/* Header - 모바일 최적화 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                SSH Remote Dev
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">
                Connected • <span className="font-mono">{sessionId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Main Content - 반응형 레이아웃 */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Checklist - 모바일: 상단, 데스크톱: 좌측 사이드바 */}
          <div className="lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto shadow-sm max-h-[40vh] lg:max-h-none">
            <div className="p-4 sm:p-6">
              <Checklist sessionId={sessionId || undefined} />
            </div>
          </div>

          {/* Terminal - 모바일: 하단, 데스크톱: 우측 메인 */}
          <div className="flex-1 bg-gray-900 min-h-0">
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
