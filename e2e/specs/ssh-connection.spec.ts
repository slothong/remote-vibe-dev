import {test, expect} from '@playwright/test';

test.describe('SSH Connection Flow', () => {
  test('should display connection form on initial load', async ({page}) => {
    await page.goto('/');

    // 연결 폼이 표시되는지 확인
    await expect(page.getByText('SSH Connection')).toBeVisible();
    await expect(page.getByLabel('Host')).toBeVisible();
    await expect(page.getByLabel('Port')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Connect'})).toBeVisible();
  });

  test('should successfully connect to SSH server and show main UI', async ({
    page,
  }) => {
    await page.goto('/');

    // 테스트 환경의 SSH 서버 정보 입력
    const host = process.env.TEST_SSH_HOST || 'localhost';
    const port = process.env.TEST_SSH_PORT || '2222';
    const username = process.env.TEST_SSH_USER || 'testuser';
    const password = process.env.TEST_SSH_PASS || 'testpass';

    // 연결 폼 입력
    await page.getByLabel('Host').fill(host);
    await page.getByLabel('Port').fill(port);
    await page.getByLabel('Username').fill(username);
    await page.locator('input[type="password"]#password').fill(password);

    // 연결 버튼 클릭
    await page.getByRole('button', {name: 'Connect'}).click();

    // 메인 화면으로 전환되는지 확인 (Connected to SSH 텍스트 표시)
    await expect(page.getByText('Connected to SSH')).toBeVisible({
      timeout: 10000,
    });

    // 메인 화면의 주요 컴포넌트 확인
    await expect(
      page.locator('[data-testid="checklist-container"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="terminal-container"]'),
    ).toBeVisible();
  });

  test('should display error message on invalid credentials', async ({
    page,
  }) => {
    await page.goto('/');

    // 잘못된 인증 정보 입력
    await page.getByLabel('Host').fill('localhost');
    await page.getByLabel('Port').fill('2222');
    await page.getByLabel('Username').fill('wronguser');
    await page.getByLabel('Password').fill('wrongpass');

    // 연결 버튼 클릭
    await page.getByRole('button', {name: 'Connect'}).click();

    // 에러 메시지 표시 확인
    await expect(page.locator('[role="alert"]')).toBeVisible({timeout: 5000});

    // 여전히 연결 화면에 있는지 확인
    await expect(page.getByText('SSH Connection')).toBeVisible();
  });

  test('should display error message on connection timeout', async ({
    page,
  }) => {
    await page.goto('/');

    // 존재하지 않는 호스트 입력
    await page.getByLabel('Host').fill('192.0.2.1'); // TEST-NET-1 (unreachable)
    await page.getByLabel('Port').fill('2222');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('testpass');

    // 연결 버튼 클릭
    await page.getByRole('button', {name: 'Connect'}).click();

    // 타임아웃 에러 메시지 표시 확인
    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 15000,
    });
  });
});
