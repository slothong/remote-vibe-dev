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

    client.on(
      'keyboard-interactive',
      (_name, _instructions, _instructionsLang, prompts, finish) => {
        if (
          prompts.length > 0 &&
          prompts[0].prompt.toLowerCase().includes('password')
        ) {
          finish([config.password || '']);
        } else {
          finish([]);
        }
      },
    );

    const connectionConfig: ConnectConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: 20000,
    };

    if (config.password) {
      connectionConfig.password = config.password;
      connectionConfig.tryKeyboard = true;
    }

    if (config.privateKey) {
      connectionConfig.privateKey = config.privateKey;
    }

    client.connect(connectionConfig);
  });
}
