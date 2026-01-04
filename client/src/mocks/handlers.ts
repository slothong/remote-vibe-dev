import {http, HttpResponse} from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const handlers = [
  // GET /api/plan - 성공 케이스
  http.get(`${API_BASE_URL}/api/plan`, ({request}) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Session ID is required',
        },
        {status: 400},
      );
    }

    // 기본 성공 응답
    return HttpResponse.json({
      success: true,
      data: {
        sections: [
          {
            title: 'Test Section',
            items: [
              {text: 'Task 1', checked: false},
              {text: 'Task 2', checked: true},
            ],
          },
        ],
      },
    });
  }),

  // POST /api/plan/update-check
  http.post(`${API_BASE_URL}/api/plan/update-check`, () => {
    return HttpResponse.json({
      success: true,
    });
  }),

  // POST /api/plan/add-item
  http.post(`${API_BASE_URL}/api/plan/add-item`, () => {
    return HttpResponse.json({
      success: true,
    });
  }),

  // DELETE /api/plan/delete-item
  http.delete(`${API_BASE_URL}/api/plan/delete-item`, () => {
    return HttpResponse.json({
      success: true,
    });
  }),

  // POST /api/ssh/connect
  http.post(`${API_BASE_URL}/api/ssh/connect`, () => {
    return HttpResponse.json({
      success: true,
      sessionId: 'test-session-id',
    });
  }),
];
