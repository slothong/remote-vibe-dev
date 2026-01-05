import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Terminal} from './terminal';

// Mock xterm
vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class {
      open = vi.fn();
      write = vi.fn();
      writeln = vi.fn();
      onData = vi.fn(() => ({dispose: vi.fn()}));
      dispose = vi.fn();
      loadAddon = vi.fn();
      cols = 80;
      rows = 24;
    },
  };
});

vi.mock('@xterm/addon-fit', () => {
  return {
    FitAddon: class {
      fit = vi.fn();
    },
  };
});

describe('터미널 컴포넌트를 렌더링할 수 있다', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('터미널 컨테이너를 렌더링한다', () => {
    render(<Terminal />);

    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toBeInTheDocument();
  });

  it('terminal-container 클래스를 가진다', () => {
    render(<Terminal />);

    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toHaveClass('terminal-container');
  });
});

describe('터미널을 화면 하단에 배치한다', () => {
  it('전체 너비와 높이 클래스를 가진다', () => {
    render(<Terminal />);

    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toHaveClass('w-full', 'h-full');
  });
});

describe('모바일 터미널 키보드', () => {
  it('모바일 키보드 컴포넌트를 렌더링한다', () => {
    render(<Terminal sessionId="test-session" />);

    expect(screen.getByLabelText('Up')).toBeInTheDocument();
    expect(screen.getByLabelText('Down')).toBeInTheDocument();
    expect(screen.getByLabelText('Left')).toBeInTheDocument();
    expect(screen.getByLabelText('Right')).toBeInTheDocument();
    expect(screen.getByLabelText('ESC')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter')).toBeInTheDocument();
  });
});
