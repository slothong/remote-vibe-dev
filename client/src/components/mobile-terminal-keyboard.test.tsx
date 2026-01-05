import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {MobileTerminalKeyboard} from './mobile-terminal-keyboard';

describe('MobileTerminalKeyboard', () => {
  it('renders arrow buttons', () => {
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    expect(screen.getByLabelText('Up')).toBeInTheDocument();
    expect(screen.getByLabelText('Down')).toBeInTheDocument();
    expect(screen.getByLabelText('Left')).toBeInTheDocument();
    expect(screen.getByLabelText('Right')).toBeInTheDocument();
  });

  it('renders ESC and Enter buttons', () => {
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    expect(screen.getByLabelText('ESC')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter')).toBeInTheDocument();
  });

  it('calls onKeyPress with arrow up sequence when Up button is clicked', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('Up'));

    expect(onKeyPress).toHaveBeenCalledWith('\x1b[A');
  });

  it('calls onKeyPress with arrow down sequence when Down button is clicked', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('Down'));

    expect(onKeyPress).toHaveBeenCalledWith('\x1b[B');
  });

  it('calls onKeyPress with arrow left sequence when Left button is clicked', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('Left'));

    expect(onKeyPress).toHaveBeenCalledWith('\x1b[D');
  });

  it('calls onKeyPress with arrow right sequence when Right button is clicked', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('Right'));

    expect(onKeyPress).toHaveBeenCalledWith('\x1b[C');
  });

  it('calls onKeyPress with ESC sequence when ESC button is clicked', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('ESC'));

    expect(onKeyPress).toHaveBeenCalledWith('\x1b');
  });

  it('calls onKeyPress with Enter sequence when Enter button is clicked', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<MobileTerminalKeyboard onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('Enter'));

    expect(onKeyPress).toHaveBeenCalledWith('\r');
  });
});
