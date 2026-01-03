import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {createAPIServer} from './api-server';
import {WebSocketBridge} from './websocket-server';
import type {Server} from 'http';

describe('API Server SSH Connection', () => {
  let server: Server;
  let wsServer: WebSocketBridge;
  const port = 3100;
  const wsPort = 3101;

  beforeAll(async () => {
    wsServer = new WebSocketBridge(wsPort);
    await wsServer.start();
    server = await createAPIServer(port, wsServer);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    if (wsServer) {
      await wsServer.close();
    }
  });

  it('should accept SSH connection request', async () => {
    const response = await fetch(`http://localhost:${port}/api/ssh/connect`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        host: 'test.example.com',
        port: 22,
        username: 'testuser',
        authMethod: 'password',
        password: 'testpass',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });

  it('should return error for invalid SSH config', async () => {
    const response = await fetch(`http://localhost:${port}/api/ssh/connect`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        host: '',
        port: 22,
        username: 'testuser',
      }),
    });

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(data.success).toBe(false);
    expect(data).toHaveProperty('error');
  });
});

describe('API Server Plan Management', () => {
  let server: Server;
  let wsServer: WebSocketBridge;
  const port = 3102;
  const wsPort = 3103;

  beforeAll(async () => {
    wsServer = new WebSocketBridge(wsPort);
    await wsServer.start();
    server = await createAPIServer(port, wsServer);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    if (wsServer) {
      await wsServer.close();
    }
  });

  it('should return error when sessionId is missing from GET /api/plan', async () => {
    const response = await fetch(`http://localhost:${port}/api/plan`);

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session ID is required');
  });

  it('should return error when session not found for GET /api/plan', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan?sessionId=invalid-session-id`,
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session not found');
  });

  it('should return error when sessionId is missing from POST /api/plan/update-check', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan/update-check`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sectionTitle: 'Test Section',
          itemIndex: 0,
          checked: true,
        }),
      },
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session ID is required');
  });

  it('should return error when required fields are missing from POST /api/plan/update-check', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan/update-check`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionId: 'test-session',
        }),
      },
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe(
      'Section title, item index, and checked status are required',
    );
  });

  it('should return error when session not found for POST /api/plan/update-check', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan/update-check`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionId: 'invalid-session-id',
          sectionTitle: 'Test Section',
          itemIndex: 0,
          checked: true,
        }),
      },
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session not found');
  });

  it('should return error when sessionId is missing from POST /api/plan/add-item', async () => {
    const response = await fetch(`http://localhost:${port}/api/plan/add-item`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        sectionTitle: 'Test Section',
        itemText: 'New item',
      }),
    });

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session ID is required');
  });

  it('should return error when required fields are missing from POST /api/plan/add-item', async () => {
    const response = await fetch(`http://localhost:${port}/api/plan/add-item`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        sessionId: 'test-session',
      }),
    });

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Section title and item text are required');
  });

  it('should return error when session not found for POST /api/plan/add-item', async () => {
    const response = await fetch(`http://localhost:${port}/api/plan/add-item`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        sessionId: 'invalid-session-id',
        sectionTitle: 'Test Section',
        itemText: 'New item',
      }),
    });

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session not found');
  });

  it('should return error when sessionId is missing from DELETE /api/plan/delete-item', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan/delete-item`,
      {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sectionTitle: 'Test Section',
          itemIndex: 0,
        }),
      },
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session ID is required');
  });

  it('should return error when required fields are missing from DELETE /api/plan/delete-item', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan/delete-item`,
      {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionId: 'test-session',
        }),
      },
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Section title and item index are required');
  });

  it('should return error when session not found for DELETE /api/plan/delete-item', async () => {
    const response = await fetch(
      `http://localhost:${port}/api/plan/delete-item`,
      {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionId: 'invalid-session-id',
          sectionTitle: 'Test Section',
          itemIndex: 0,
        }),
      },
    );

    const data = (await response.json()) as {success: boolean; error?: string};
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session not found');
  });
});
