import {describe, it, expect} from 'vitest';
import {connectToSSH} from './ssh-service';
import {server} from '../mocks/server';
import {http, HttpResponse} from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

describe('SSH Service', () => {
  it('should connect to SSH successfully', async () => {
    const result = await connectToSSH({
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      password: 'testpass',
    });

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe('test-session-id');
  });

  it('should handle connection failure', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/ssh/connect`, () => {
        return HttpResponse.json({
          success: false,
          error: 'Connection refused',
        });
      }),
    );

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
    server.use(
      http.post(`${API_BASE_URL}/api/ssh/connect`, () => {
        return HttpResponse.error();
      }),
    );

    const result = await connectToSSH({
      host: 'example.com',
      port: 22,
      username: 'testuser',
      authMethod: 'password',
      password: 'testpass',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error - cannot reach server');
  });
});
