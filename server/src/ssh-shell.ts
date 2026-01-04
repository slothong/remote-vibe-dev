import type {Client, ClientChannel} from 'ssh2';

export interface ShellResult {
  success: boolean;
  stream?: ClientChannel;
  error?: string;
}

export async function startShell(client: Client): Promise<ShellResult> {
  return new Promise(resolve => {
    client.shell((err, stream) => {
      if (err) {
        resolve({
          success: false,
          error: err.message,
        });
        return;
      }

      resolve({
        success: true,
        stream,
      });
    });
  });
}

export async function startTmuxSession(client: Client): Promise<ShellResult> {
  return new Promise(resolve => {
    client.shell((err, stream) => {
      if (err) {
        resolve({
          success: false,
          error: err.message,
        });
        return;
      }

      // tmux 세션 존재 여부에 따라 분기
      // 세션이 있으면: attach만 수행
      // 세션이 없으면: remote-dev-workspace로 이동 후 새 세션 생성 및 claude 실행
      const tmuxCommand =
        'if tmux has-session -t remote-tdd-dev 2>/dev/null; then tmux attach-session -t remote-tdd-dev; else cd remote-dev-workspace && tmux new-session -s remote-tdd-dev claude; fi\n';
      stream.write(tmuxCommand);

      resolve({
        success: true,
        stream,
      });
    });
  });
}
