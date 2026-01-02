import {createAPIServer} from './api-server';

const API_PORT = 3000;

async function main() {
  console.log('Starting server...');

  try {
    await createAPIServer(API_PORT);
    console.log(`API server listening on http://localhost:${API_PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
