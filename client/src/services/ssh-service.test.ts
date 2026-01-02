import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {connectToSSH} from './ssh-service';

global.fetch = vi.fn();

describe('SSH Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should connect to SSH successfully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({success: true, sessionId: 'test-session-id'}),
    });

    const result = await connectToSSH({
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      password: 'testpass',
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/ssh/connect',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          host: 'example.com',
          port: 22,
          username: 'testuser',
          authMethod: 'password',
          password: 'testpass',
        }),
      },
    );
  });

  it('should handle connection failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({success: false, error: 'Connection refused'}),
    });

    const result = await connectToSSH({
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      password: 'wrongpass',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );

    const result = await connectToSSH({
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      password: 'testpass',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});
