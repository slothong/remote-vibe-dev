import express, {type Request, type Response} from 'express';
import cors from 'cors';
import path from 'path';
import type {Server} from 'http';
import {SSHSessionManager} from './ssh-session';
import {SSHWebSocketBridge} from './ssh-websocket-bridge';
import type {WebSocketBridge} from './websocket-server';
import type {SSHConfig} from './ssh-config';
import {
  readPlanFile,
  parsePlan,
  updateCheckStatus,
  writePlanFile,
  addPlanItem,
  deletePlanItem,
} from './plan-parser';

const sshManager = new SSHSessionManager();
let sshWsBridge: SSHWebSocketBridge | null = null;

export function createAPIServer(
  port: number,
  wsServer: WebSocketBridge,
): Promise<Server> {
  const app = express();

  // CORS는 개발 모드에서만 활성화
  if (process.env.NODE_ENV !== 'production') {
    app.use(cors());
  }

  app.use(express.json());

  sshWsBridge = new SSHWebSocketBridge(sshManager, wsServer);

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

  app.post('/api/ssh/shell', async (req: Request, res: Response) => {
    try {
      const {sessionId} = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      if (!sshWsBridge) {
        res.status(500).json({
          success: false,
          error: 'WebSocket bridge not initialized',
        });
        return;
      }

      await sshWsBridge.connect(sessionId);

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start shell',
      });
    }
  });

  app.get('/api/plan', async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      const session = sshManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      const fileResult = await readPlanFile(session.client);
      if (!fileResult.success) {
        res.status(500).json({
          success: false,
          error: fileResult.error || 'Failed to read plan',
        });
        return;
      }

      const parsed = parsePlan(fileResult.content!);

      res.json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read plan',
      });
    }
  });

  app.post('/api/plan/update-check', async (req: Request, res: Response) => {
    try {
      const {sessionId, sectionTitle, itemIndex, checked} = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      if (!sectionTitle || itemIndex === undefined || checked === undefined) {
        res.status(400).json({
          success: false,
          error: 'Section title, item index, and checked status are required',
        });
        return;
      }

      const session = sshManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      // Read current plan
      const fileResult = await readPlanFile(session.client);
      if (!fileResult.success) {
        res.status(500).json({
          success: false,
          error: fileResult.error || 'Failed to read plan',
        });
        return;
      }

      // Update check status
      const updatedContent = updateCheckStatus(
        fileResult.content!,
        sectionTitle,
        itemIndex,
        checked,
      );

      // Write back to remote
      const writeResult = await writePlanFile(session.client, updatedContent);
      if (!writeResult.success) {
        res.status(500).json({
          success: false,
          error: writeResult.error || 'Failed to write plan',
        });
        return;
      }

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update check',
      });
    }
  });

  app.post('/api/plan/add-item', async (req: Request, res: Response) => {
    try {
      const {sessionId, sectionTitle, itemText} = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      if (!sectionTitle || !itemText) {
        res.status(400).json({
          success: false,
          error: 'Section title and item text are required',
        });
        return;
      }

      const session = sshManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      // Read current plan
      const fileResult = await readPlanFile(session.client);
      if (!fileResult.success) {
        res.status(500).json({
          success: false,
          error: fileResult.error || 'Failed to read plan',
        });
        return;
      }

      // Add new item
      const updatedContent = addPlanItem(
        fileResult.content!,
        sectionTitle,
        itemText,
      );

      // Write back to remote
      const writeResult = await writePlanFile(session.client, updatedContent);
      if (!writeResult.success) {
        res.status(500).json({
          success: false,
          error: writeResult.error || 'Failed to write plan',
        });
        return;
      }

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add item',
      });
    }
  });

  app.delete('/api/plan/delete-item', async (req: Request, res: Response) => {
    try {
      const {sessionId, sectionTitle, itemIndex} = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      if (!sectionTitle || itemIndex === undefined) {
        res.status(400).json({
          success: false,
          error: 'Section title and item index are required',
        });
        return;
      }

      const session = sshManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      // Read current plan
      const fileResult = await readPlanFile(session.client);
      if (!fileResult.success) {
        res.status(500).json({
          success: false,
          error: fileResult.error || 'Failed to read plan',
        });
        return;
      }

      // Delete item
      const updatedContent = deletePlanItem(
        fileResult.content!,
        sectionTitle,
        itemIndex,
      );

      // Write back to remote
      const writeResult = await writePlanFile(session.client, updatedContent);
      if (!writeResult.success) {
        res.status(500).json({
          success: false,
          error: writeResult.error || 'Failed to write plan',
        });
        return;
      }

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete item',
      });
    }
  });

  // 프로덕션 모드에서 클라이언트 정적 파일 서빙
  if (process.env.NODE_ENV === 'production') {
    // client/dist 폴더의 정적 파일 제공
    // server 디렉토리에서 실행되므로 상위 디렉토리의 client/dist를 찾기
    const clientDistPath = path.resolve(process.cwd(), '..', 'client/dist');
    app.use(express.static(clientDistPath));

    // SPA fallback: 모든 non-API 요청을 index.html로 리다이렉트
    app.use((req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return new Promise(resolve => {
    const server = app.listen(port, () => {
      resolve(server);
    });
  });
}
