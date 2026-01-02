import {Client, type ConnectConfig} from 'ssh2';
import type {SSHConfig} from './ssh-config';
import {validateSSHConfig} from './ssh-validation';

export interface SSHConnectionResult {
  success: boolean;
  error?: string;
  client?: Client;
}

export async function connectToSSH(
  config: SSHConfig,
): Promise<SSHConnectionResult> {
  if (!validateSSHConfig(config)) {
    return {
      success: false,
      error: 'Invalid SSH configuration',
    };
  }

  return new Promise(resolve => {
    const client = new Client();

    client.on('ready', () => {
      resolve({
        success: true,
        client,
      });
    });

    client.on('error', err => {
      resolve({
        success: false,
        error: err.message,
      });
    });

    const connectionConfig: ConnectConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: 5000,
    };

    if (config.password) {
      connectionConfig.password = config.password;
    }

    if (config.privateKey) {
      connectionConfig.privateKey = config.privateKey;
    }

    client.connect(connectionConfig);
  });
}
