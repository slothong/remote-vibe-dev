import '@testing-library/jest-dom';
import {server} from '../mocks/server';
import {beforeAll, afterEach, afterAll} from 'vitest';

// 모든 테스트 전에 MSW 서버 시작
beforeAll(() => server.listen());

// 각 테스트 후 핸들러 리셋
afterEach(() => server.resetHandlers());

// 모든 테스트 후 MSW 서버 종료
afterAll(() => server.close());
