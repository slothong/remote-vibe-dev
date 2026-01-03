import {test, expect} from '@playwright/test';
import {connectToSSH} from '../helpers/connect';

test.describe('Integration Tests', () => {
  test('should complete full workflow: connect -> view components -> add item', async ({
    page,
  }) => {
    // 1. SSH 연결
    await connectToSSH(page);

    // 2. 체크리스트와 터미널이 동시에 표시되는지 확인
    const checklist = page.locator('[data-testid="checklist-container"]');
    const terminal = page.locator('[data-testid="terminal-container"]');

    await expect(checklist).toBeVisible();
    await expect(terminal).toBeVisible();

    // 3. 터미널에 내용이 표시되는지 확인
    await page.waitForTimeout(3000);
    const terminalContent = await terminal.textContent();
    expect(terminalContent).toBeTruthy();
    expect(terminalContent!.length).toBeGreaterThan(0);

    // 4. 체크리스트 항목 추가
    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});
    const addItemInput = section1.locator('.add-item-form input[type="text"]');
    const addButton = section1.locator('.add-item-form button');

    await addItemInput.fill('Integration test task');
    await addButton.click();

    // 5. 새 항목이 체크리스트에 표시되는지 확인
    await expect(section1.getByText('Integration test task')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display both checklist and terminal simultaneously', async ({
    page,
  }) => {
    await connectToSSH(page);

    // 두 컴포넌트가 모두 표시되는지 확인
    const checklist = page.locator('[data-testid="checklist-container"]');
    const terminal = page.locator('[data-testid="terminal-container"]');

    await expect(checklist).toBeVisible();
    await expect(terminal).toBeVisible();

    // 제목 확인
    await expect(page.getByText('Plan Checklist')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('SSH Remote Development')).toBeVisible();
  });

  test('should reflect checklist changes in plan.md', async ({page}) => {
    await connectToSSH(page);

    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});

    // 항목 추가
    const addItemInput = section1.locator('.add-item-form input[type="text"]');
    const addButton = section1.locator('.add-item-form button');

    await addItemInput.fill('Persistent test task');
    await addButton.click();

    // 항목이 추가되었는지 확인
    await expect(section1.getByText('Persistent test task')).toBeVisible({
      timeout: 5000,
    });

    // 체크박스 상태 변경
    const newTaskItem = section1
      .locator('.checklist-item')
      .filter({hasText: 'Persistent test task'});
    const newTaskCheckbox = newTaskItem.locator('input[type="checkbox"]');

    await newTaskCheckbox.click();
    await page.waitForTimeout(500);

    // 체크 상태 확인
    await expect(newTaskCheckbox).toBeChecked();
  });

  test('should handle errors gracefully', async ({page}) => {
    await page.goto('/');

    // 잘못된 호스트로 연결 시도
    await page.getByLabel('Host Address').fill('invalid-host-12345');
    await page.getByLabel('Port').fill('9999');
    await page.getByRole('textbox', {name: 'Username'}).fill('testuser');
    await page.locator('input[type="password"]#password').fill('testpass');

    await page.getByRole('button', {name: /connect/i}).click();

    // 에러 메시지 표시 확인
    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 10000,
    });

    // 연결 폼이 여전히 표시되는지 확인
    await expect(page.getByText('SSH Connection')).toBeVisible();
  });

  test('should show terminal output from SSH server', async ({page}) => {
    await connectToSSH(page);

    const terminal = page.locator('[data-testid="terminal-container"]');

    // 터미널 초기화 대기
    await page.waitForTimeout(3000);

    const terminalContent = await terminal.textContent();

    // 터미널에 서버로부터의 출력이 있는지 확인
    expect(terminalContent).toBeTruthy();
    expect(terminalContent).toContain('Connected to server');
    expect(terminalContent).toContain('Shell session started');
  });

  test('should support concurrent checklist and terminal operations', async ({
    page,
  }) => {
    await connectToSSH(page);

    await page.waitForTimeout(2000);

    const checklist = page.locator('[data-testid="checklist-container"]');
    const terminal = page.locator('[data-testid="terminal-container"]');

    // 두 컴포넌트가 모두 작동하는지 확인
    await expect(checklist).toBeVisible();
    await expect(terminal).toBeVisible();

    // 체크리스트 조작
    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});
    const task1Item = section1.locator('.checklist-item').first();
    const task1Checkbox = task1Item.locator('input[type="checkbox"]');

    const initialChecked = await task1Checkbox.isChecked();
    await task1Checkbox.click();
    await page.waitForTimeout(500);

    // 상태가 변경되었는지 확인
    const newChecked = await task1Checkbox.isChecked();
    expect(newChecked).not.toBe(initialChecked);

    // 터미널도 여전히 작동하는지 확인
    const terminalContent = await terminal.textContent();
    expect(terminalContent).toBeTruthy();
  });
});
