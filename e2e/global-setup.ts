import {MockSSHServer} from './fixtures/ssh-server';

let sshServer: MockSSHServer;

export default async function globalSetup() {
  console.log('\n🚀 Starting E2E test environment setup...\n');

  try {
    // Mock SSH 서버 시작
    console.log('Starting Mock SSH server...');
    sshServer = new MockSSHServer({
      port: 2222,
      username: 'testuser',
      password: 'testpass',
    });

    await sshServer.start();
    console.log('✅ Mock SSH server started successfully');

    // 환경 변수 설정
    process.env.TEST_SSH_HOST = 'localhost';
    process.env.TEST_SSH_PORT = '2222';
    process.env.TEST_SSH_USER = 'testuser';
    process.env.TEST_SSH_PASS = 'testpass';

    console.log('\n📝 Test environment variables set:');
    console.log(`   SSH_HOST: ${process.env.TEST_SSH_HOST}`);
    console.log(`   SSH_PORT: ${process.env.TEST_SSH_PORT}`);
    console.log(`   SSH_USER: ${process.env.TEST_SSH_USER}`);

    // SSH 서버 인스턴스를 전역에 저장
    (global as any).__SSH_SERVER__ = sshServer;

    console.log('\n✅ Global setup completed successfully\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}
