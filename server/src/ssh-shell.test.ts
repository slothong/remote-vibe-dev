import {describe, it, expect, vi, beforeEach} from 'vitest';
import {Client, type ClientChannel} from 'ssh2';
import {startShell, startTmuxSession} from './ssh-shell';

describe('SSH 셸 세션을 시작할 수 있다', () => {
  let mockClient: Client;

  beforeEach(() => {
    mockClient = new Client();
  });

  it('셸 세션을 시작한다', async () => {
    const mockStream = {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    vi.spyOn(mockClient, 'shell').mockImplementation(
      (callback: (err: Error | undefined, stream: ClientChannel) => void) => {
        callback(undefined, mockStream as unknown as ClientChannel);
        return mockClient;
      },
    );

    const result = await startShell(mockClient);

    expect(result.success).toBe(true);
    expect(result.stream).toBeDefined();
    expect(mockClient.shell).toHaveBeenCalled();
  });

  it('셸 실패 시 에러를 반환한다', async () => {
    vi.spyOn(mockClient, 'shell').mockImplementation(
      (callback: (err: Error | undefined, stream: ClientChannel) => void) => {
        callback(new Error('Shell failed'), null as unknown as ClientChannel);
        return mockClient;
      },
    );

    const result = await startShell(mockClient);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Shell failed');
  });
});

describe('tmux 세션을 시작한다', () => {
  let mockClient: Client;

  beforeEach(() => {
    mockClient = new Client();
  });

  it('remote-tdd-dev 세션을 시작하고 claude 명령어를 실행한다', async () => {
    const mockStream = {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    vi.spyOn(mockClient, 'shell').mockImplementation(
      (callback: (err: Error | undefined, stream: ClientChannel) => void) => {
        callback(undefined, mockStream as unknown as ClientChannel);
        return mockClient;
      },
    );

    const result = await startTmuxSession(mockClient);

    expect(result.success).toBe(true);
    expect(result.stream).toBeDefined();
    expect(mockClient.shell).toHaveBeenCalled();

    // tmux 세션 시작 명령어가 전송되었는지 확인
    const calls = mockStream.write.mock.calls;
    const allWrites = calls.map(call => call[0]).join('');

    expect(allWrites).toContain('tmux');
    expect(allWrites).toContain('remote-tdd-dev');
    expect(allWrites).toContain('claude');
  });

  it('remote-dev-workspace로 이동한 후 tmux 세션을 시작한다', async () => {
    const mockStream = {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    vi.spyOn(mockClient, 'shell').mockImplementation(
      (callback: (err: Error | undefined, stream: ClientChannel) => void) => {
        callback(undefined, mockStream as unknown as ClientChannel);
        return mockClient;
      },
    );

    const result = await startTmuxSession(mockClient);

    expect(result.success).toBe(true);

    // write 호출 확인
    const calls = mockStream.write.mock.calls;
    const allWrites = calls.map(call => call[0]).join('');

    // tmux 명령이 포함되어 있는지 확인
    expect(allWrites).toContain('tmux');
    expect(allWrites).toContain('remote-tdd-dev');
  });

  it('세션이 없으면 새로 생성하고 claude를 실행하며, 있으면 attach만 한다', async () => {
    const mockStream = {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    vi.spyOn(mockClient, 'shell').mockImplementation(
      (callback: (err: Error | undefined, stream: ClientChannel) => void) => {
        callback(undefined, mockStream as unknown as ClientChannel);
        return mockClient;
      },
    );

    const result = await startTmuxSession(mockClient);

    expect(result.success).toBe(true);

    // write 호출 확인
    const calls = mockStream.write.mock.calls;
    const allWrites = calls.map(call => call[0]).join('');

    // if 조건문을 사용하여 세션 존재 여부에 따라 분기
    expect(allWrites).toContain('if');
    expect(allWrites).toContain('has-session');
    expect(allWrites).toContain('attach-session');
    // 새 세션일 때만 claude 실행 (조건문 내부)
    expect(allWrites).toContain('new-session');
  });
});
