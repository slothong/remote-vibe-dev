import {test, expect} from '@playwright/test';
import {connectToSSH} from '../helpers/connect';

test.describe('Checklist Component', () => {
  test.beforeEach(async ({page}) => {
    await connectToSSH(page);
  });

  test('should render checklist component with sections', async ({page}) => {
    // 체크리스트 컴포넌트가 표시되는지 확인
    const checklist = page.locator('[data-testid="checklist-container"]');
    await expect(checklist).toBeVisible();

    // 제목 확인
    await expect(page.getByText('Plan Checklist')).toBeVisible();

    // 섹션이 표시되는지 확인 (test_plan.md 기준)
    await expect(page.getByText('Test Section 1')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('Test Section 2')).toBeVisible();
  });

  test('should display checklist items with correct status', async ({
    page,
  }) => {
    // 체크박스 항목들이 표시되는지 확인
    await expect(page.getByText('Test task 1')).toBeVisible({timeout: 5000});
    await expect(page.getByText('Test task 2')).toBeVisible();
    await expect(page.getByText('Test task 3')).toBeVisible();

    // 체크 상태 확인 (Test task 2는 체크되어 있어야 함)
    const checkboxes = page.locator('.checklist-item input[type="checkbox"]');
    const count = await checkboxes.count();

    expect(count).toBeGreaterThan(0);

    // Test task 2의 체크박스 찾기 (index 1)
    const section1Items = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'})
      .locator('.checklist-item');

    const task1Checkbox = section1Items.nth(0).locator('input[type="checkbox"]');
    const task2Checkbox = section1Items.nth(1).locator('input[type="checkbox"]');
    const task3Checkbox = section1Items.nth(2).locator('input[type="checkbox"]');

    await expect(task1Checkbox).not.toBeChecked();
    await expect(task2Checkbox).toBeChecked();
    await expect(task3Checkbox).not.toBeChecked();
  });

  test('should not allow checkbox toggling (disabled state)', async ({
    page,
  }) => {
    // 대기
    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});
    const task1Item = section1.locator('.checklist-item').nth(0);
    const task1Checkbox = task1Item.locator('input[type="checkbox"]');

    // 체크박스가 disabled 상태인지 확인
    await expect(task1Checkbox).toBeDisabled();

    // 초기 상태 확인 (체크되지 않음)
    const initialChecked = await task1Checkbox.isChecked();

    // 체크박스 클릭 시도 (disabled 상태이므로 실제로 변경되지 않음)
    await task1Checkbox.click({force: true});
    await page.waitForTimeout(500);

    // 상태가 변경되지 않았는지 확인
    const afterClickChecked = await task1Checkbox.isChecked();
    expect(afterClickChecked).toBe(initialChecked);
  });

  test('should add new checklist item', async ({page}) => {
    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});

    // 새 항목 입력 필드 찾기
    const addItemInput = section1.locator('.add-item-form input[type="text"]');
    const addButton = section1.locator('.add-item-form button');

    // 새 항목 추가
    await addItemInput.fill('New test task');
    await addButton.click();

    // 새 항목이 표시되는지 확인
    await expect(section1.getByText('New test task')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should delete checklist item', async ({page}) => {
    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});

    // Test task 1의 삭제 버튼 찾기
    const task1Item = section1.locator('.checklist-item').first();
    const deleteButton = task1Item.locator('button.delete-button');

    // 삭제 전 텍스트 저장
    const taskText = await task1Item.locator('span').first().textContent();

    // 삭제 버튼 클릭
    await deleteButton.click();
    await page.waitForTimeout(1000);

    // 항목이 사라졌는지 확인
    if (taskText) {
      const itemsWithText = section1.locator('.checklist-item', {
        hasText: taskText,
      });
      await expect(itemsWithText).toHaveCount(0);
    }
  });

  test('should display Go button for each item', async ({page}) => {
    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});
    const task1Item = section1.locator('.checklist-item').first();

    // Go 버튼이 표시되는지 확인 (아이콘 버튼이므로 title 속성 확인)
    const goButton = task1Item.locator('button.go-button');
    await expect(goButton).toBeVisible();
    await expect(goButton).toHaveAttribute('title', 'Execute this task');
  });

  test('should execute claude /go command when Go button is clicked', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});
    const task1Item = section1.locator('.checklist-item').first();

    // Go 버튼 찾기
    const goButton = task1Item.locator('button.go-button');

    // 터미널 컴포넌트 찾기
    const terminal = page.locator('[data-testid="terminal-container"]');
    await expect(terminal).toBeVisible();

    // Go 버튼 클릭
    await goButton.click();

    // 명령 실행 대기
    await page.waitForTimeout(1500);

    // 터미널에 관련 출력이 있는지 확인 (WebSocket을 통해 전송됨)
    const terminalText = await terminal.textContent();
    expect(terminalText).toBeTruthy();
  });

  test('should reflect plan.md changes in checklist', async ({page}) => {
    await page.waitForTimeout(2000);

    const section1 = page
      .locator('.checklist-section')
      .filter({hasText: 'Test Section 1'});

    // 새 항목 추가
    const addItemInput = section1.locator('.add-item-form input[type="text"]');
    const addButton = section1.locator('.add-item-form button');

    await addItemInput.fill('Auto-refresh test task');
    await addButton.click();

    // 새 항목이 자동으로 표시되는지 확인
    await expect(section1.getByText('Auto-refresh test task')).toBeVisible({
      timeout: 5000,
    });

    // 새로 추가된 항목도 disabled 체크박스를 가지는지 확인
    const newTaskItem = section1
      .locator('.checklist-item')
      .filter({hasText: 'Auto-refresh test task'});
    const newTaskCheckbox = newTaskItem.locator('input[type="checkbox"]');

    // 체크박스가 disabled 상태인지 확인
    await expect(newTaskCheckbox).toBeDisabled();
    // 초기 상태는 체크되지 않은 상태
    await expect(newTaskCheckbox).not.toBeChecked();
  });
});
