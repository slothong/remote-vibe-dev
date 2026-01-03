import {Server} from 'ssh2';
import {readFileSync} from 'fs';
import {join} from 'path';

export interface MockSSHServerConfig {
  port?: number;
  username?: string;
  password?: string;
  hostKeyPath?: string;
}

export class MockSSHServer {
  private server: Server;
  private port: number;
  private username: string;
  private password: string;
  private hostKeyPath: string;
  private isListening: boolean = false;

  constructor(config: MockSSHServerConfig = {}) {
    this.port = config.port || 2222;
    this.username = config.username || 'testuser';
    this.password = config.password || 'testpass';
    this.hostKeyPath =
      config.hostKeyPath || join(__dirname, 'test_host_rsa_key');

    this.server = new Server(
      {
        hostKeys: [readFileSync(this.hostKeyPath)],
      },
      client => {
        console.log('SSH Client connected');

        client.on('authentication', ctx => {
          if (ctx.method === 'password') {
            if (
              ctx.username === this.username &&
              ctx.password === this.password
            ) {
              console.log(`Authentication successful for user: ${ctx.username}`);
              ctx.accept();
            } else {
              console.log(`Authentication failed for user: ${ctx.username}`);
              ctx.reject();
            }
          } else {
            console.log(`Unsupported authentication method: ${ctx.method}`);
            ctx.reject();
          }
        });

        client.on('ready', () => {
          console.log('SSH Client authenticated');

          client.on('session', accept => {
            const session = accept();

            session.on('shell', (accept, reject) => {
              console.log('Shell session requested');
              const stream = accept();

              // 초기 프롬프트 전송
              stream.write('$ ');

              // 커맨드 처리
              let buffer = '';
              stream.on('data', (data: Buffer) => {
                const input = data.toString();

                // Echo input
                stream.write(input);
                buffer += input;

                // Enter 키 처리
                if (input.includes('\r') || input.includes('\n')) {
                  const command = buffer.trim();

                  if (command === 'exit') {
                    stream.exit(0);
                    stream.end();
                  } else if (command.startsWith('cd ')) {
                    const dir = command.substring(3).trim();
                    stream.write(`\r\nChanged directory to: ${dir}\r\n`);
                  } else if (command.startsWith('claude')) {
                    stream.write('\r\nClaude Code started...\r\n');
                    stream.write('Ready for tasks!\r\n');
                  } else if (command) {
                    stream.write(`\r\nCommand executed: ${command}\r\n`);
                  }

                  buffer = '';
                  stream.write('$ ');
                }
              });

              stream.on('close', () => {
                console.log('Shell session closed');
              });
            });

            session.on('sftp', (accept, reject) => {
              console.log('SFTP session requested');
              const sftp = accept();

              // SFTP 파일 작업 시뮬레이션
              // 테스트용 plan.md 파일 읽기
              let testPlanContent: string;
              try {
                testPlanContent = readFileSync(
                  join(__dirname, 'test_plan.md'),
                  'utf-8',
                );
              } catch (error) {
                // Fallback to default content
                testPlanContent = `# Test Plan

## Test Section
- [ ] Test task 1
- [x] Test task 2
- [ ] Test task 3
`;
              }

              sftp.on('OPEN', (reqid, filename, flags, attrs) => {
                console.log(`SFTP OPEN: ${filename}`);
                // 파일 핸들 반환 (간단히 Buffer 사용)
                const handle = Buffer.from(filename);
                sftp.handle(reqid, handle);
              });

              sftp.on('READ', (reqid, handle, offset, length) => {
                console.log('SFTP READ');
                const filename = handle.toString();

                if (filename.includes('plan.md')) {
                  const data = Buffer.from(testPlanContent);
                  const chunk = data.slice(offset, offset + length);

                  if (chunk.length > 0) {
                    sftp.data(reqid, chunk);
                  } else {
                    sftp.status(reqid, 1); // EOF
                  }
                } else {
                  sftp.status(reqid, 2); // No such file
                }
              });

              sftp.on('WRITE', (reqid, handle, offset, data) => {
                console.log('SFTP WRITE');
                // 쓰기 성공 시뮬레이션
                sftp.status(reqid, 0); // Success
              });

              sftp.on('CLOSE', (reqid, handle) => {
                console.log('SFTP CLOSE');
                sftp.status(reqid, 0); // Success
              });

              sftp.on('STAT', (reqid, path) => {
                console.log(`SFTP STAT: ${path}`);
                if (path.includes('plan.md')) {
                  sftp.attrs(reqid, {
                    mode: 0o100644,
                    size: testPlanContent.length,
                    uid: 1000,
                    gid: 1000,
                    atime: Date.now() / 1000,
                    mtime: Date.now() / 1000,
                  });
                } else {
                  sftp.status(reqid, 2); // No such file
                }
              });
            });
          });
        });

        client.on('error', err => {
          console.error('SSH Client error:', err);
        });

        client.on('end', () => {
          console.log('SSH Client disconnected');
        });
      },
    );

    this.server.on('error', err => {
      console.error('SSH Server error:', err);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, '127.0.0.1', () => {
        this.isListening = true;
        console.log(`Mock SSH server listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', err => {
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.isListening) {
        this.server.close(() => {
          this.isListening = false;
          console.log('Mock SSH server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.port;
  }

  getUsername(): string {
    return this.username;
  }

  getPassword(): string {
    return this.password;
  }
}
