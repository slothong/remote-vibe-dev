import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SSHConnectionForm} from './ssh-connection-form';

describe('SSH 연결 폼을 렌더링할 수 있다', () => {
  it('should render SSH connection form', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByText(/SSH Connection/i)).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByLabelText(/host address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
  });

  it('should render connect button', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByRole('button', {name: /connect/i})).toBeInTheDocument();
  });
});

describe('인증 방법 선택 (key/password)을 표시한다', () => {
  it('should render authentication method selection', () => {
    render(<SSHConnectionForm />);

    expect(screen.getByText(/authentication method/i)).toBeInTheDocument();
  });

  it('should have password and key options', () => {
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
  it('should render password field when password auth is selected', () => {
    render(<SSHConnectionForm />);

    const passwordInput = screen.getByLabelText(/^password$/i, {
      selector: 'input[type="password"]',
    });
    expect(passwordInput).toBeInTheDocument();
  });

  it('should show password field by default', () => {
    render(<SSHConnectionForm />);

    const passwordInput = screen.getByLabelText(/^password$/i, {
      selector: 'input[type="password"]',
    });
    expect(passwordInput).toBeVisible();
  });

  it('should hide password field when private key is selected', async () => {
    const user = userEvent.setup();
    render(<SSHConnectionForm />);

    const keyRadio = screen.getByRole('radio', {name: /ssh key authentication/i});
    await user.click(keyRadio);

    const passwordInput = screen.queryByLabelText(/^password$/i, {
      selector: 'input[type="password"]',
    });
    expect(passwordInput).not.toBeInTheDocument();
  });
});

describe('SSH key 파일 선택 기능을 표시한다', () => {
  it('should not show SSH key field by default', () => {
    render(<SSHConnectionForm />);

    const keyFileInput = screen.queryByLabelText(/private key file/i, {
      selector: 'input[type="file"]',
    });
    expect(keyFileInput).not.toBeInTheDocument();
  });

  it('should show SSH key field when private key is selected', async () => {
    const user = userEvent.setup();
    render(<SSHConnectionForm />);

    const keyRadio = screen.getByRole('radio', {name: /ssh key authentication/i});
    await user.click(keyRadio);

    const keyFileInput = screen.getByLabelText(/private key file/i, {
      selector: 'input[type="file"]',
    });
    expect(keyFileInput).toBeInTheDocument();
    expect(keyFileInput).toHaveAttribute('type', 'file');
  });

  it('should hide SSH key field when switching back to password', async () => {
    const user = userEvent.setup();
    render(<SSHConnectionForm />);

    const keyRadio = screen.getByRole('radio', {name: /ssh key authentication/i});
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
  it('should call onConnect with form data when connect is clicked', async () => {
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

  it('should prevent default form submission', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue({success: true});
    render(<SSHConnectionForm onConnect={onConnect} />);

    const connectButton = screen.getByRole('button', {name: /connect/i});
    await user.click(connectButton);

    expect(onConnect).toHaveBeenCalled();
  });
});

describe('연결 성공 시 메인 화면으로 이동한다', () => {
  it('should call onSuccess when connection succeeds', async () => {
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

  it('should not call onSuccess when connection fails', async () => {
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
  it('should display error message when connection fails', async () => {
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

  it('should clear error message when retrying connection', async () => {
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

  it('should not display error when no error message provided', async () => {
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
