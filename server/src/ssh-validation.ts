import type {SSHConfig} from './ssh-config';

export function validateSSHConfig(config: SSHConfig): boolean {
  if (!config.host || config.host.trim() === '') {
    return false;
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    return false;
  }

  if (!config.username || config.username.trim() === '') {
    return false;
  }

  if (!config.password && !config.privateKey) {
    return false;
  }

  return true;
}
