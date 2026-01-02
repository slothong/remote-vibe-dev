import {describe, it, expect} from 'vitest';
import {connectToSSH} from './ssh-client';
import type {SSHConfig} from './ssh-config';

describe('SSH 클라이언트로 원격 서버에 연결할 수 있다', () => {
  it('should return a connection result when connecting', async () => {
    const config: SSHConfig = {
      host: 'invalid-host-that-does-not-exist.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass',
    };

    const result = await connectToSSH(config);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
  });

  it('should return success false for invalid host', async () => {
    const config: SSHConfig = {
      host: 'invalid-host-that-does-not-exist.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass',
    };

    const result = await connectToSSH(config);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate config before connecting', async () => {
    const config: SSHConfig = {
      host: '',
      port: 22,
      username: 'testuser',
      password: 'testpass',
    };

    const result = await connectToSSH(config);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid SSH configuration');
  });
});

describe('SSH 연결 실패 시 에러를 반환한다', () => {
  it('should return error message when connection fails', async () => {
    const config: SSHConfig = {
      host: 'invalid-host-that-does-not-exist.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass',
    };

    const result = await connectToSSH(config);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    if (result.error) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('should not return client when connection fails', async () => {
    const config: SSHConfig = {
      host: 'invalid-host-that-does-not-exist.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass',
    };

    const result = await connectToSSH(config);

    expect(result.success).toBe(false);
    expect(result.client).toBeUndefined();
  });

  it('should return specific error for invalid config', async () => {
    const config: SSHConfig = {
      host: 'localhost',
      port: 0,
      username: 'testuser',
      password: 'testpass',
    };

    const result = await connectToSSH(config);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid SSH configuration');
  });
});
