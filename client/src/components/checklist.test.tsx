import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {Checklist} from './checklist';

describe('체크리스트 컴포넌트를 렌더링할 수 있다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should render checklist container', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [
              {text: 'Task 1', checked: false},
              {text: 'Task 2', checked: true},
            ],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByTestId('checklist-container')).toBeDefined();
    });
  });

  it('should show loading state initially', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise(() => {
          // never resolves
        }),
    );

    render(<Checklist sessionId="test-session" />);

    expect(screen.getByText('Loading plan...')).toBeDefined();
  });

  it('should show error state when fetch fails', async () => {
    const mockError = {
      success: false,
      error: 'Failed to load plan',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockError,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load plan/)).toBeDefined();
    });
  });
});

describe('섹션별로 그룹화된 체크리스트를 표시한다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should display sections with titles', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Section 1',
            items: [{text: 'Task 1', checked: false}],
          },
          {
            title: 'Section 2',
            items: [{text: 'Task 2', checked: false}],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Section 1')).toBeDefined();
      expect(screen.getByText('Section 2')).toBeDefined();
    });
  });
});

describe('각 체크박스 항목을 표시한다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should display checkbox items', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [
              {text: 'Task 1', checked: false},
              {text: 'Task 2', checked: true},
            ],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeDefined();
      expect(screen.getByText('Task 2')).toBeDefined();
    });
  });
});

describe('체크박스 상태를 시각적으로 표시한다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should show checked status', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [
              {text: 'Unchecked task', checked: false},
              {text: 'Checked task', checked: true},
            ],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
    });
  });
});

describe('각 항목에 go 버튼을 표시한다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should display go buttons', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [{text: 'Task 1', checked: false}],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const goButton = screen.getByTitle('Execute this task');
      expect(goButton).toBeDefined();
      expect(goButton.className).toContain('go-button');
    });
  });
});

describe('각 항목에 삭제 버튼을 표시한다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should display delete buttons', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [{text: 'Task 1', checked: false}],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete this task');
      expect(deleteButton).toBeDefined();
      expect(deleteButton.className).toContain('delete-button');
    });
  });
});

describe('각 섹션에 항목 추가 폼을 표시한다', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should display add item form for each section', async () => {
    const mockPlanData = {
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [{text: 'Task 1', checked: false}],
          },
        ],
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => mockPlanData,
    });

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add new task...')).toBeDefined();
      const addButton = document.querySelector('.add-item-form button');
      expect(addButton).toBeDefined();
    });
  });
});
