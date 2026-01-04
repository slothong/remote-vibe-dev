import {useState, useEffect, type FormEvent} from 'react';

interface SSHConnectionFormProps {
  onConnect?: (data: {
    host: string;
    port: number;
    username: string;
    authMethod: 'password' | 'key';
    password?: string;
    privateKeyFile?: File;
  }) => Promise<{success: boolean; error?: string}>;
  onSuccess?: () => void;
}

export function SSHConnectionForm({
  onConnect,
  onSuccess,
}: SSHConnectionFormProps) {
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [error, setError] = useState<string | null>(null);
  const [savedInfo, setSavedInfo] = useState<{
    host: string;
    port: number;
    username: string;
    authMethod: 'password' | 'key';
  } | null>(null);
  const [rememberConnection, setRememberConnection] = useState(false);

  useEffect(() => {
    // Load saved connection info on component mount
    const saved = localStorage.getItem('sshConnectionInfo');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedInfo(parsed);
        setAuthMethod(parsed.authMethod || 'password');
        setRememberConnection(true);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous error

    const formData = new FormData(e.currentTarget);

    const data = {
      host: formData.get('host') as string,
      port: parseInt(formData.get('port') as string, 10),
      username: formData.get('username') as string,
      authMethod,
      ...(authMethod === 'password' && {
        password: formData.get('password') as string,
      }),
      ...(authMethod === 'key' && {
        privateKeyFile: formData.get('privateKeyFile') as File,
      }),
    };

    if (onConnect) {
      const result = await onConnect(data);
      if (result.success) {
        // Save connection info if checkbox is checked
        if (rememberConnection) {
          const infoToSave = {
            host: data.host,
            port: data.port,
            username: data.username,
            authMethod: data.authMethod,
          };
          localStorage.setItem('sshConnectionInfo', JSON.stringify(infoToSave));
        } else {
          // Remove saved connection info if checkbox is unchecked
          localStorage.removeItem('sshConnectionInfo');
        }
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to connect');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-8 py-4 sm:py-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            SSH Connection
          </h2>
          <p className="text-blue-100 mt-1 text-sm sm:text-base">
            Connect to your remote development server
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="host"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Host Address
              </label>
              <input
                type="text"
                id="host"
                name="host"
                defaultValue={savedInfo?.host || ''}
                placeholder="example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="port"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Port
                </label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  defaultValue={savedInfo?.port || ''}
                  placeholder="22"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  defaultValue={savedInfo?.username || ''}
                  placeholder="user"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 space-y-3">
            <legend className="text-sm font-semibold text-gray-700 mb-3">
              Authentication Method
            </legend>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                id="auth-password"
                name="authMethod"
                value="password"
                checked={authMethod === 'password'}
                onChange={() => setAuthMethod('password')}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Password Authentication
                </span>
                <p className="text-xs text-gray-500">
                  Use username and password
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                id="auth-key"
                name="authMethod"
                value="key"
                checked={authMethod === 'key'}
                onChange={() => setAuthMethod('key')}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  SSH Key Authentication
                </span>
                <p className="text-xs text-gray-500">Use private key file</p>
              </div>
            </label>
          </div>

          {authMethod === 'password' && (
            <div className="animate-fadeIn">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {authMethod === 'key' && (
            <div className="animate-fadeIn">
              <label
                htmlFor="privateKeyFile"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Private Key File
              </label>
              <input
                type="file"
                id="privateKeyFile"
                name="privateKeyFile"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition-all"
              />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fadeIn"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberConnection"
              name="rememberConnection"
              checked={rememberConnection}
              onChange={e => setRememberConnection(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="rememberConnection"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Remember connection info
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Connect to Server
          </button>
        </form>
      </div>
    </div>
  );
}
