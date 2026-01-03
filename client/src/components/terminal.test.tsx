import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Terminal} from './terminal';

// Mock xterm
vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class {
      open = vi.fn();
      write = vi.fn();
      onData = vi.fn();
      dispose = vi.fn();
      loadAddon = vi.fn();
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

  it('should render terminal container', () => {
    render(<Terminal />);

    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toBeInTheDocument();
  });

  it('should have terminal-container class', () => {
    render(<Terminal />);

    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toHaveClass('terminal-container');
  });
});

describe('터미널을 화면 하단에 배치한다', () => {
  it('should have full width and fixed height', () => {
    render(<Terminal />);

    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toHaveStyle({width: '100%', height: '300px'});
  });
});
