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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 타임아웃을 위한 헬퍼 함수
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 10000,
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeout),
    ),
  ]);
}

export async function connectToSSH(
  data: SSHConnectionData,
): Promise<SSHConnectionResult> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/ssh/connect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
      10000, // 10초 타임아웃
    );

    // HTTP 에러 상태 체크
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error ||
          errorData.message ||
          `Connection failed (HTTP ${response.status})`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // 네트워크 에러, 타임아웃 등 처리
    if (error instanceof Error) {
      if (error.message === 'Connection timeout') {
        return {
          success: false,
          error: 'Connection timeout - please check host and port',
        };
      }
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error - cannot reach server',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}
