import {randomUUID} from 'crypto';
import type {Client} from 'ssh2';
import type {SSHConfig} from './ssh-config';
import {connectToSSH, type SSHConnectionResult} from './ssh-client';

export interface SSHSession {
  id: string;
  config: SSHConfig;
  client: Client;
  createdAt: Date;
}

export interface SessionConnectionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export class SSHSessionManager {
  private sessions: Map<string, SSHSession> = new Map();

  async connect(config: SSHConfig): Promise<SessionConnectionResult> {
    const result: SSHConnectionResult = await connectToSSH(config);

    if (!result.success || !result.client) {
      return {
        success: false,
        error: result.error,
      };
    }

    const sessionId = randomUUID();
    const session: SSHSession = {
      id: sessionId,
      config,
      client: result.client,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    return {
      success: true,
      sessionId,
    };
  }

  getSession(sessionId: string): SSHSession | undefined {
    return this.sessions.get(sessionId);
  }

  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.client.end();
      this.sessions.delete(sessionId);
    }
  }

  async disconnectAll(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.disconnect(sessionId);
    }
  }

  getAllSessions(): SSHSession[] {
    return Array.from(this.sessions.values());
  }
}
