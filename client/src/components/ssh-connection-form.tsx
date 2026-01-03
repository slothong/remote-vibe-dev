import {useState, type FormEvent} from 'react';

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
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to connect');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">SSH Connection</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
            Host
          </label>
          <input
            type="text"
            id="host"
            name="host"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
            Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <fieldset className="border border-gray-300 rounded-md p-4">
          <legend className="text-sm font-medium text-gray-700 px-2">Authentication Method</legend>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="auth-password"
                name="authMethod"
                value="password"
                checked={authMethod === 'password'}
                onChange={() => setAuthMethod('password')}
                className="mr-2"
              />
              <label htmlFor="auth-password" className="text-sm text-gray-700">
                Using credentials
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="auth-key"
                name="authMethod"
                value="key"
                checked={authMethod === 'key'}
                onChange={() => setAuthMethod('key')}
                className="mr-2"
              />
              <label htmlFor="auth-key" className="text-sm text-gray-700">
                Using SSH key
              </label>
            </div>
          </div>
        </fieldset>
        {authMethod === 'password' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {authMethod === 'key' && (
          <div>
            <label htmlFor="privateKeyFile" className="block text-sm font-medium text-gray-700 mb-1">
              Private Key File
            </label>
            <input
              type="file"
              id="privateKeyFile"
              name="privateKeyFile"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {error && (
          <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Connect
        </button>
      </form>
    </div>
  );
}
