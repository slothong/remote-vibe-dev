import express, {type Request, type Response} from 'express';
import cors from 'cors';
import type {Server} from 'http';
import {SSHSessionManager} from './ssh-session';
import type {SSHConfig} from './ssh-config';

const sshManager = new SSHSessionManager();

export function createAPIServer(port: number): Promise<Server> {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post('/api/ssh/connect', async (req: Request, res: Response) => {
    try {
      const {host, port: sshPort, username, authMethod, password} = req.body;

      const config: SSHConfig = {
        host,
        port: sshPort,
        username,
        ...(authMethod === 'password' && {password}),
      };

      const result = await sshManager.connect(config);

      if (result.success) {
        res.json({
          success: true,
          sessionId: result.sessionId,
        });
      } else {
        res.json({
          success: false,
          error: result.error || 'Connection failed',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  return new Promise(resolve => {
    const server = app.listen(port, () => {
      resolve(server);
    });
  });
}
