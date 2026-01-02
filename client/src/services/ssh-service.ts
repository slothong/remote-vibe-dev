interface SSHConnectionData {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKeyFile?: File;
}

interface SSHConnectionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

const API_BASE_URL = 'http://localhost:3000';

export async function connectToSSH(
  data: SSHConnectionData,
): Promise<SSHConnectionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ssh/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
