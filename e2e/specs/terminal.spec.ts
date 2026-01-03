import {test, expect} from '@playwright/test';
import {connectToSSH} from '../helpers/connect';

test.describe('Terminal Component', () => {
  test.beforeEach(async ({page}) => {
    await connectToSSH(page);
  });

  test('should render terminal component', async ({page}) => {
    // 터미널 컴포넌트가 표시되는지 확인
    const terminal = page.locator('[data-testid="terminal-container"]');
    await expect(terminal).toBeVisible();

    // xterm.js가 로드되었는지 확인
    const xtermViewport = page.locator('.xterm-viewport, .xterm');
    await expect(xtermViewport).toBeVisible({timeout: 5000});
  });

  test('should display connection message', async ({page}) => {
    // 터미널이 초기화될 때까지 대기
    await page.waitForTimeout(2000);

    const terminal = page.locator('[data-testid="terminal-container"]');
    const terminalContent = await terminal.textContent();

    // 연결 메시지가 표시되는지 확인
    expect(terminalContent).toContain('Connected to server');
  });

  test('should start shell session automatically', async ({page}) => {
    await page.waitForTimeout(2000);

    const terminal = page.locator('[data-testid="terminal-container"]');
    const terminalContent = await terminal.textContent();

    // 셸 세션 시작 메시지 확인
    expect(terminalContent).toContain('Shell session started');
  });

  test('should execute claude command automatically', async ({page}) => {
    // 자동 명령 실행 대기
    await page.waitForTimeout(4000);

    const terminal = page.locator('[data-testid="terminal-container"]');
    const terminalContent = await terminal.textContent();

    // claude 명령 실행 확인 (cd 또는 claude 텍스트 포함)
    expect(
      terminalContent?.includes('claude') ||
        terminalContent?.includes('remote-dev-workspace'),
    ).toBeTruthy();
  });
});

test.describe('WebSocket Communication', () => {
  test.beforeEach(async ({page}) => {
    await connectToSSH(page);
  });

  test('should establish WebSocket connection', async ({page}) => {
    // WebSocket 연결 확인을 위한 대기
    await page.waitForTimeout(2000);

    const terminal = page.locator('[data-testid="terminal-container"]');
    await expect(terminal).toBeVisible();

    const terminalContent = await terminal.textContent();
    // 연결 메시지가 있으면 WebSocket이 연결됨
    expect(terminalContent).toContain('Connected to server');
  });

  test('should receive messages from SSH via WebSocket', async ({page}) => {
    // 초기 메시지 수신 대기
    await page.waitForTimeout(3000);

    const terminal = page.locator('[data-testid="terminal-container"]');
    const terminalContent = await terminal.textContent();

    // 터미널에 내용이 있어야 함 (SSH로부터 메시지 수신)
    expect(terminalContent).toBeTruthy();
    expect(terminalContent!.length).toBeGreaterThan(0);
  });

  test('should maintain WebSocket connection during page lifecycle', async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const terminal = page.locator('[data-testid="terminal-container"]');
    await expect(terminal).toBeVisible();

    // 몇 초 대기 후에도 여전히 연결되어 있는지 확인
    await page.waitForTimeout(3000);

    const terminalContent = await terminal.textContent();
    expect(terminalContent).toBeTruthy();
  });
});
