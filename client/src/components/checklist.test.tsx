import {describe, it, expect, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {Checklist} from './checklist';
import * as websocketManager from '../services/websocket-manager';
import {server} from '../mocks/server';
import {http, HttpResponse} from 'msw';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

describe('체크리스트 컴포넌트를 렌더링할 수 있다', () => {
  it('체크리스트 컨테이너를 렌더링한다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByTestId('checklist-container')).toBeDefined();
    });
  });

  it('초기에 로딩 상태를 표시한다', () => {
    server.use(
      http.get(`${API_BASE_URL}/api/plan`, async () => {
        // Delay response to keep loading state visible
        await new Promise(() => {
          // never resolves
        });
      }),
    );

    render(<Checklist sessionId="test-session" />);

    expect(screen.getByText('Loading plan...')).toBeDefined();
  });

  it('가져오기 실패 시 에러 상태를 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/plan`, () => {
        return HttpResponse.json({
          success: false,
          error: 'Failed to load plan',
        });
      }),
    );

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load plan/)).toBeDefined();
    });
  });
});

describe('섹션별로 그룹화된 체크리스트를 표시한다', () => {
  it('제목과 함께 섹션을 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/plan`, () => {
        return HttpResponse.json({
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
        });
      }),
    );

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Section 1')).toBeDefined();
      expect(screen.getByText('Section 2')).toBeDefined();
    });
  });
});

describe('각 체크박스 항목을 표시한다', () => {
  it('체크박스 항목을 표시한다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeDefined();
      expect(screen.getByText('Task 2')).toBeDefined();
    });
  });
});

describe('체크박스 상태를 시각적으로 표시한다', () => {
  it('체크된 상태를 표시한다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole<HTMLInputElement>('checkbox');
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
    });
  });
});

describe('각 항목에 go 버튼을 표시한다', () => {
  it('go 버튼을 표시한다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const goButtons = screen.getAllByTitle('Execute this task');
      expect(goButtons.length).toBeGreaterThan(0);
      expect(goButtons[0].className).toContain('go-button');
    });
  });
});

describe('각 항목에 삭제 버튼을 표시한다', () => {
  it('삭제 버튼을 표시한다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete this task');
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(deleteButtons[0].className).toContain('delete-button');
    });
  });
});

describe('각 섹션에 항목 추가 폼을 표시한다', () => {
  it('각 섹션에 항목 추가 폼을 표시한다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add new task...')).toBeDefined();
      const addButton = document.querySelector('.add-item-form button');
      expect(addButton).toBeDefined();
    });
  });
});

describe('Go 버튼 클릭 시 올바른 형식의 명령어를 보낸다', () => {
  it('섹션과 항목 인덱스로 /go 명령어를 전송한다 (예: /go 1.2)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/plan`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            sections: [
              {
                title: 'Section 1',
                items: [
                  {text: 'Task 1.1', checked: false},
                  {text: 'Task 1.2', checked: false},
                ],
              },
              {
                title: 'Section 2',
                items: [{text: 'Task 2.1', checked: false}],
              },
            ],
          },
        });
      }),
    );

    // Mock WebSocket
    const mockSend = vi.fn();
    const mockWebSocket = {
      readyState: WebSocket.OPEN,
      send: mockSend,
      close: vi.fn(),
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
    } as unknown as WebSocket;

    vi.spyOn(websocketManager, 'getWebSocket').mockReturnValue(mockWebSocket);
    vi.spyOn(websocketManager, 'initWebSocket').mockReturnValue(mockWebSocket);

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const goButtons = screen.queryAllByTitle('Execute this task');
      expect(goButtons.length).toBeGreaterThan(0);
    });

    // Click Go button on first item of first section (should send "/go 1.1")
    const goButtons = screen.getAllByTitle('Execute this task');
    goButtons[0].click();

    // Wait for async character-by-character sending
    await waitFor(() => {
      // Check that characters were sent individually: '/', 'g', 'o', ' ', '1', '.', '1', '\r'
      const calls = mockSend.mock.calls.map(call => call[0]);
      const sent = calls.join('');
      expect(sent).toContain('/go 1.1\r');
    });
  });
});

describe('go 명령어를 전송한 후 enter를 같이 전송해서 명령어가 실행되게 해야 한다', () => {
  it('go 명령어 실행을 위해 캐리지 리턴 (\\r)을 전송한다', async () => {
    // Mock WebSocket
    const mockSend = vi.fn();
    const mockWebSocket = {
      readyState: WebSocket.OPEN,
      send: mockSend,
      close: vi.fn(),
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
    } as unknown as WebSocket;

    vi.spyOn(websocketManager, 'getWebSocket').mockReturnValue(mockWebSocket);
    vi.spyOn(websocketManager, 'initWebSocket').mockReturnValue(mockWebSocket);

    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const goButtons = screen.queryAllByTitle('Execute this task');
      expect(goButtons.length).toBeGreaterThan(0);
    });

    // Click go button
    const goButtons = screen.getAllByTitle('Execute this task');
    goButtons[0].click();

    // Wait for async character-by-character sending
    await waitFor(() => {
      // Verify command was sent character by character with carriage return at the end
      const calls = mockSend.mock.calls.map(call => call[0]);
      const sent = calls.join('');
      expect(sent).toBe('/go 1.1\r');
      // Verify the last character is \r for execution
      expect(calls[calls.length - 1]).toBe('\r');
    });
  });
});

describe('체크박스는 사용자가 클릭해서 상태 변경할 수 없다', () => {
  it('체크박스가 disabled 되어있다', async () => {
    render(<Checklist sessionId="test-session" />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole<HTMLInputElement>('checkbox');
      expect(checkboxes[0].disabled).toBe(true);
      expect(checkboxes[1].disabled).toBe(true);
    });
  });
});

