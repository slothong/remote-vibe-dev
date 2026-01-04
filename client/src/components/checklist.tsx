import {useEffect, useState} from 'react';
import {getWebSocket} from '../services/websocket-manager';

interface PlanItem {
  text: string;
  checked: boolean;
}

interface PlanSection {
  title: string;
  items: PlanItem[];
}

interface ParsedPlan {
  sections: PlanSection[];
}

interface ChecklistProps {
  sessionId?: string;
}

export function Checklist({sessionId}: ChecklistProps) {
  const [plan, setPlan] = useState<ParsedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const fetchPlan = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/plan?sessionId=${sessionId}`,
      );

      const data = (await response.json()) as {
        success: boolean;
        data?: ParsedPlan;
        error?: string;
      };

      if (data.success && data.data) {
        setPlan(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load plan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGoClick = async (sectionIndex: number, itemIndex: number) => {
    const ws = getWebSocket();

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }

    // 항목의 고유 키 생성
    const itemKey = `${sectionIndex}-${itemIndex}`;

    // 이미 로딩 중이면 무시
    if (loadingItems.has(itemKey)) {
      return;
    }

    // 로딩 상태 시작
    setLoadingItems(prev => new Set(prev).add(itemKey));

    // 섹션 번호와 항목 번호는 1부터 시작 (인덱스는 0부터 시작하므로 +1)
    const commandText = `/go ${sectionIndex + 1}.${itemIndex + 1}`;

    ws.send(commandText);
    // 엔터를 인식하게 하기 위해 지연과 함께 전송
    await new Promise(resolve => setTimeout(resolve, 10));
    // 마지막에 Enter (carriage return) 전송
    ws.send('\r');
  };

  const handleDeleteClick = async (sectionTitle: string, itemIndex: number) => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/plan/delete-item`,
        {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            sessionId,
            sectionTitle,
            itemIndex,
          }),
        },
      );

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        // Refresh plan data
        await fetchPlan();
      } else {
        setError(data.error || 'Failed to delete item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleAddItem = async (sectionTitle: string) => {
    if (!sessionId || !plan) return;

    const itemText = newItemTexts[sectionTitle]?.trim();
    if (!itemText) return;

    // Optimistic update: 즉시 로컬 상태에 항목 추가
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;

      return {
        ...prevPlan,
        sections: prevPlan.sections.map(section => {
          if (section.title !== sectionTitle) return section;

          return {
            ...section,
            items: [...section.items, {text: itemText, checked: false}],
          };
        }),
      };
    });

    // Clear input immediately
    setNewItemTexts(prev => ({...prev, [sectionTitle]: ''}));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/plan/add-item`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            sessionId,
            sectionTitle,
            itemText,
          }),
        },
      );

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        // Sync with server after a brief delay to ensure persistence
        setTimeout(async () => {
          await fetchPlan();
        }, 100);
      } else {
        // Revert on error
        await fetchPlan();
        setError(data.error || 'Failed to add item');
      }
    } catch (err) {
      // Revert on error
      await fetchPlan();
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  useEffect(() => {
    void fetchPlan();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500">No plan data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="checklist-container">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
            Plan Checklist
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
            Track your development tasks
          </p>
        </div>
      </div>

      {plan.sections.map((section, sectionIndex) => (
        <div
          key={`section-${sectionIndex}-${section.title}`}
          className="checklist-section bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-200"
        >
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
            <span className="flex-1 min-w-0 truncate">{section.title}</span>
          </h3>

          <ul className="checklist-items space-y-2 mb-3 sm:mb-4">
            {section.items.map((item, itemIndex) => (
              <li
                key={`item-${sectionIndex}-${itemIndex}-${item.text}`}
                className="checklist-item group bg-white rounded-lg p-2 sm:p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-not-allowed mt-0.5 flex-shrink-0"
                  />
                  <span
                    className={`flex-1 text-xs sm:text-sm leading-relaxed break-words ${item.checked ? 'checked line-through text-gray-400' : 'text-gray-700 font-medium'}`}
                  >
                    {item.text}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      className={`go-button p-1.5 sm:p-2 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md sm:rounded-lg shadow-sm hover:shadow transition-all ${loadingItems.has(`${sectionIndex}-${itemIndex}`) ? 'loading opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() =>
                        void handleGoClick(sectionIndex, itemIndex)
                      }
                      disabled={loadingItems.has(
                        `${sectionIndex}-${itemIndex}`,
                      )}
                      title="Execute this task"
                    >
                      {loadingItems.has(`${sectionIndex}-${itemIndex}`) ? (
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      className="delete-button p-1.5 sm:p-2 text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-md sm:rounded-lg shadow-sm hover:shadow transition-all"
                      onClick={() => {
                        void handleDeleteClick(section.title, itemIndex);
                      }}
                      title="Delete this task"
                    >
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="add-item-form flex gap-1.5 sm:gap-2">
            <input
              type="text"
              placeholder="Add new task..."
              value={newItemTexts[section.title] || ''}
              onChange={e =>
                setNewItemTexts(prev => ({
                  ...prev,
                  [section.title]: e.target.value,
                }))
              }
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  void handleAddItem(section.title);
                }
              }}
              className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => void handleAddItem(section.title)}
              className="px-3 sm:px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg shadow-sm hover:shadow transition-all duration-200"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
