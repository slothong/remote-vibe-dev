import {describe, it, expect} from 'vitest';
import {validateSSHConfig} from './ssh-validation';

describe('SSH 연결 정보의 유효성을 검증할 수 있다', () => {
  it('should return true for valid config with password', () => {
    const result = validateSSHConfig({
      host: 'example.com',
      port: 22,
      username: 'user',
      password: 'pass',
    });

    expect(result).toBe(true);
  });

  it('should return true for valid config with privateKey', () => {
    const result = validateSSHConfig({
      host: 'example.com',
      port: 22,
      username: 'user',
      privateKey: 'key',
    });

    expect(result).toBe(true);
  });

  it('should return false when host is empty', () => {
    const result = validateSSHConfig({
      host: '',
      port: 22,
      username: 'user',
      password: 'pass',
    });

    expect(result).toBe(false);
  });

  it('should return false when port is invalid', () => {
    const result = validateSSHConfig({
      host: 'example.com',
      port: 0,
      username: 'user',
      password: 'pass',
    });

    expect(result).toBe(false);
  });

  it('should return false when username is empty', () => {
    const result = validateSSHConfig({
      host: 'example.com',
      port: 22,
      username: '',
      password: 'pass',
    });

    expect(result).toBe(false);
  });

  it('should return false when both password and privateKey are missing', () => {
    const result = validateSSHConfig({
      host: 'example.com',
      port: 22,
      username: 'user',
    });

    expect(result).toBe(false);
  });
});
