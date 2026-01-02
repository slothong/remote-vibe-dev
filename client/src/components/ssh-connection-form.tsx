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
    <div>
      <h2>SSH Connection</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="host">Host</label>
          <input type="text" id="host" name="host" />
        </div>
        <div>
          <label htmlFor="port">Port</label>
          <input type="number" id="port" name="port" />
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <input type="text" id="username" name="username" />
        </div>
        <fieldset>
          <legend>Authentication Method</legend>
          <div>
            <input
              type="radio"
              id="auth-password"
              name="authMethod"
              value="password"
              checked={authMethod === 'password'}
              onChange={() => setAuthMethod('password')}
            />
            <label htmlFor="auth-password">Password</label>
          </div>
          <div>
            <input
              type="radio"
              id="auth-key"
              name="authMethod"
              value="key"
              checked={authMethod === 'key'}
              onChange={() => setAuthMethod('key')}
            />
            <label htmlFor="auth-key">Private Key</label>
          </div>
        </fieldset>
        {authMethod === 'password' && (
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" />
          </div>
        )}
        {authMethod === 'key' && (
          <div>
            <label htmlFor="privateKeyFile">Private Key File</label>
            <input type="file" id="privateKeyFile" name="privateKeyFile" />
          </div>
        )}
        {error && (
          <div role="alert" style={{color: 'red'}}>
            {error}
          </div>
        )}
        <button type="submit">Connect</button>
      </form>
    </div>
  );
}
