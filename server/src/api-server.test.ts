import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {createAPIServer} from './api-server';
import type {Server} from 'http';

describe('API Server SSH Connection', () => {
  let server: Server;
  const port = 3100;

  beforeAll(async () => {
    server = await createAPIServer(port);
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
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
