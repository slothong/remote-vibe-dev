import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SSHConnectionForm} from './ssh-connection-form';

describe('SSH 연결 폼을 렌더링할 수 있다', () => {
  it('SSH 연결 폼을 렌더링한다', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByText(/SSH Connection/i)).toBeInTheDocument();
  });

  it('모든 폼 필드를 렌더링한다', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByLabelText(/host address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
  });

  it('연결 버튼을 렌더링한다', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByRole('button', {name: /connect/i})).toBeInTheDocument();
  });
});

describe('인증 방법 선택 (key/password)을 표시한다', () => {
  it('인증 방법 선택을 렌더링한다', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByText(/authentication method/i)).toBeInTheDocument();
  });

  it('비밀번호와 키 옵션을 가진다', () => {
    render(<SSHConnectionForm />);

    expect(
      screen.getByRole('radio', {name: /password authentication/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {name: /ssh key authentication/i}),
    ).toBeInTheDocument();
  });
});

describe('password 입력 필드를 표시한다', () => {
  it('비밀번호 인증 선택 시 비밀번호 필드를 렌더링한다', () => {
    render(<SSHConnectionForm />);

    const passwordInput = screen.getByLabelText(/^password$/i, {
      selector: 'input[type="password"]',
    });
    expect(passwordInput).toBeInTheDocument();
  });

  it('기본적으로 비밀번호 필드를 표시한다', () => {
    render(<SSHConnectionForm />);

    const passwordInput = screen.getByLabelText(/^password$/i, {
      selector: 'input[type="password"]',
    });
    expect(passwordInput).toBeVisible();
  });

  it('프라이빗 키 선택 시 비밀번호 필드를 숨긴다', async () => {
    const user = userEvent.setup();
    render(<SSHConnectionForm />);

    const keyRadio = screen.getByRole('radio', {
      name: /ssh key authentication/i,
    });
    await user.click(keyRadio);

    const passwordInput = screen.queryByLabelText(/^password$/i, {
      selector: 'input[type="password"]',
    });
    expect(passwordInput).not.toBeInTheDocument();
  });
});

describe('SSH key 파일 선택 기능을 표시한다', () => {
  it('기본적으로 SSH 키 필드를 표시하지 않는다', () => {
    render(<SSHConnectionForm />);

    const keyFileInput = screen.queryByLabelText(/private key file/i, {
      selector: 'input[type="file"]',
    });
    expect(keyFileInput).not.toBeInTheDocument();
  });

  it('프라이빗 키 선택 시 SSH 키 필드를 표시한다', async () => {
    const user = userEvent.setup();
    render(<SSHConnectionForm />);

    const keyRadio = screen.getByRole('radio', {
      name: /ssh key authentication/i,
    });
    await user.click(keyRadio);

    const keyFileInput = screen.getByLabelText(/private key file/i, {
      selector: 'input[type="file"]',
    });
    expect(keyFileInput).toBeInTheDocument();
    expect(keyFileInput).toHaveAttribute('type', 'file');
  });

  it('비밀번호로 다시 전환 시 SSH 키 필드를 숨긴다', async () => {
    const user = userEvent.setup();
    render(<SSHConnectionForm />);

    const keyRadio = screen.getByRole('radio', {
      name: /ssh key authentication/i,
    });
    await user.click(keyRadio);

    expect(
      screen.getByLabelText(/private key file/i, {
        selector: 'input[type="file"]',
      }),
    ).toBeInTheDocument();

    const passwordRadio = screen.getByRole('radio', {
      name: /password authentication/i,
    });
    await user.click(passwordRadio);

    const keyFileInput = screen.queryByLabelText(/private key file/i, {
      selector: 'input[type="file"]',
    });
    expect(keyFileInput).not.toBeInTheDocument();
  });
});

describe('연결 버튼 클릭 시 SSH 연결을 시도한다', () => {
  it('연결 버튼 클릭 시 폼 데이터와 함께 onConnect를 호출한다', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: true});
    render(<SSHConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');
    await user.type(screen.getByLabelText(/port/i), '22');
    await user.type(screen.getByLabelText(/^username$/i), 'testuser');
    await user.type(
      screen.getByLabelText(/^password$/i, {
        selector: 'input[type="password"]',
      }),
      'testpass',
    );

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    expect(onConnect).toHaveBeenCalledWith({
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      password: 'testpass',
    });
  });

  it('기본 폼 제출을 방지한다', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: true});
    render(<SSHConnectionForm onConnect={onConnect} />);

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    expect(onConnect).toHaveBeenCalled();
  });
});

describe('연결 성공 시 메인 화면으로 이동한다', () => {
  it('연결 성공 시 onSuccess를 호출한다', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: true});
    const onSuccess = vi.fn();
    render(<SSHConnectionForm onConnect={onConnect} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');
    await user.type(screen.getByLabelText(/port/i), '22');
    await user.type(screen.getByLabelText(/^username$/i), 'testuser');
    await user.type(
      screen.getByLabelText(/^password$/i, {
        selector: 'input[type="password"]',
      }),
      'testpass',
    );

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    // Wait for async operation
    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('연결 실패 시 onSuccess를 호출하지 않는다', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: false});
    const onSuccess = vi.fn();
    render(<SSHConnectionForm onConnect={onConnect} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    // Wait a bit to ensure onSuccess is not called
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('연결 실패 시 에러 메시지를 표시한다', () => {
  it('연결 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    const onConnect = vi
      .fn()
      .mockResolvedValue({success: false, error: 'Connection failed'});
    render(<SSHConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    // Wait for error message to appear
    const errorMessage = await screen.findByText(/connection failed/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('연결 재시도 시 에러 메시지를 지운다', async () => {
    const user = userEvent.setup();
    const onConnect = vi
      .fn()
      .mockResolvedValueOnce({success: false, error: 'Connection failed'})
      .mockResolvedValueOnce({success: true});
    render(<SSHConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    // Wait for error message to appear
    await screen.findByText(/connection failed/i);

    // Click connect again
    await user.click(connectButton);

    // Error message should be cleared
    expect(screen.queryByText(/connection failed/i)).not.toBeInTheDocument();
  });

  it('에러 메시지가 제공되지 않으면 기본 에러를 표시한다', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: false});
    render(<SSHConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should display a generic error
    const errorMessage = await screen.findByText(/failed to connect/i);
    expect(errorMessage).toBeInTheDocument();
  });
});

describe('연결 정보 기억하기', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('"연결 정보 기억하기" 체크박스를 렌더링한다', () => {
    render(<SSHConnectionForm />);

    const rememberCheckbox = screen.getByRole('checkbox', {
      name: /remember connection info/i,
    });
    expect(rememberCheckbox).toBeInTheDocument();
  });

  it('체크박스 선택 후 연결 성공 시 연결 정보를 로컬 스토리지에 저장한다', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: true});
    render(<SSHConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText(/host address/i), 'example.com');
    await user.type(screen.getByLabelText(/port/i), '22');
    await user.type(screen.getByLabelText(/^username$/i), 'testuser');

    const rememberCheckbox = screen.getByRole('checkbox', {
      name: /remember connection info/i,
    });
    await user.click(rememberCheckbox);

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    await vi.waitFor(() => {
      const saved = localStorage.getItem('sshConnectionInfo');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.host).toBe('example.com');
      expect(parsed.port).toBe(22);
      expect(parsed.username).toBe('testuser');
      expect(parsed.password).toBeUndefined(); // 패스워드는 저장하지 않음
    });
  });

  it('페이지 로드 시 저장된 연결 정보를 불러온다', () => {
    const savedInfo = {
      host: 'saved.example.com',
      port: 2222,
      username: 'saveduser',
      authMethod: 'password',
    };
    localStorage.setItem('sshConnectionInfo', JSON.stringify(savedInfo));

    render(<SSHConnectionForm />);

    const hostInput = screen.getByLabelText(/host address/i) as HTMLInputElement;
    const portInput = screen.getByLabelText(/port/i) as HTMLInputElement;
    const usernameInput = screen.getByLabelText(
      /^username$/i,
    ) as HTMLInputElement;

    expect(hostInput.value).toBe('saved.example.com');
    expect(portInput.value).toBe('2222');
    expect(usernameInput.value).toBe('saveduser');
  });

  it('로컬 스토리지에 연결 정보가 존재하면 "연결 정보 기억하기" 체크박스를 체크 상태로 초기화한다', () => {
    const savedInfo = {
      host: 'saved.example.com',
      port: 2222,
      username: 'saveduser',
      authMethod: 'password',
    };
    localStorage.setItem('sshConnectionInfo', JSON.stringify(savedInfo));

    render(<SSHConnectionForm />);

    const rememberCheckbox = screen.getByRole('checkbox', {
      name: /remember connection info/i,
    }) as HTMLInputElement;

    expect(rememberCheckbox.checked).toBe(true);
  });
});
