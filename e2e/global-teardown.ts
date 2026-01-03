export default async function globalTeardown() {
  console.log('\n🧹 Starting E2E test environment cleanup...\n');

  try {
    // 전역에 저장된 SSH 서버 인스턴스 가져오기
    const sshServer = (global as any).__SSH_SERVER__;

    if (sshServer) {
      console.log('Stopping Mock SSH server...');
      await sshServer.stop();
      console.log('✅ Mock SSH server stopped successfully');
    }

    // 환경 변수 정리
    delete process.env.TEST_SSH_HOST;
    delete process.env.TEST_SSH_PORT;
    delete process.env.TEST_SSH_USER;
    delete process.env.TEST_SSH_PASS;

    console.log('\n✅ Global teardown completed successfully\n');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // teardown 에러는 무시 (이미 테스트가 끝났으므로)
  }
}
