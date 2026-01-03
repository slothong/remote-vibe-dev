import type {Client} from 'ssh2';

export interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface FileWriteResult {
  success: boolean;
  error?: string;
}

export async function readRemoteFile(
  client: Client,
  remotePath: string,
): Promise<FileReadResult> {
  return new Promise(resolve => {
    client.sftp((err, sftp) => {
      if (err) {
        resolve({
          success: false,
          error: err.message,
        });
        return;
      }

      sftp.readFile(remotePath, 'utf-8', (err, data) => {
        if (err) {
          resolve({
            success: false,
            error: err.message,
          });
          return;
        }

        resolve({
          success: true,
          content: data.toString(),
        });
      });
    });
  });
}

export async function writeRemoteFile(
  client: Client,
  remotePath: string,
  content: string,
): Promise<FileWriteResult> {
  return new Promise(resolve => {
    client.sftp((err, sftp) => {
      if (err) {
        resolve({
          success: false,
          error: err.message,
        });
        return;
      }

      sftp.writeFile(remotePath, content, 'utf-8', err => {
        if (err) {
          resolve({
            success: false,
            error: err.message,
          });
          return;
        }

        resolve({
          success: true,
        });
      });
    });
  });
}
