import {useEffect, useState} from 'react';

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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

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

  const handleCheckToggle = async (
    sectionTitle: string,
    itemIndex: number,
    currentChecked: boolean,
  ) => {
    if (!sessionId || !plan) return;

    // Optimistic update: 즉시 로컬 상태 업데이트
    const newChecked = !currentChecked;
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;

      return {
        ...prevPlan,
        sections: prevPlan.sections.map(section => {
          if (section.title !== sectionTitle) return section;

          return {
            ...section,
            items: section.items.map((item, idx) => {
              if (idx !== itemIndex) return item;
              return {...item, checked: newChecked};
            }),
          };
        }),
      };
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/plan/update-check`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            sessionId,
            sectionTitle,
            itemIndex,
            checked: newChecked,
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
        setError(data.error || 'Failed to update check status');
      }
    } catch (err) {
      // Revert on error
      await fetchPlan();
      setError(
        err instanceof Error ? err.message : 'Failed to update check status',
      );
    }
  };

  const handleGoClick = (itemText: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }

    const command = `claude /go ${itemText}\n`;
    ws.send(command);
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

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setWs(websocket);
    };

    websocket.onerror = () => {
      setError('WebSocket connection error');
    };

    websocket.onclose = () => {
      setWs(null);
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [sessionId]);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading plan...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  if (!plan) {
    return <div className="p-4 text-center text-gray-500">No plan data</div>;
  }

  return (
    <div className="space-y-6" data-testid="checklist-container">
      <h2 className="text-xl font-bold text-gray-800">Plan Checklist</h2>
      {plan.sections.map((section, sectionIndex) => (
        <div
          key={`section-${sectionIndex}-${section.title}`}
          className="checklist-section bg-gray-50 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{section.title}</h3>
          <ul className="checklist-items space-y-2">
            {section.items.map((item, itemIndex) => (
              <li
                key={`item-${sectionIndex}-${itemIndex}-${item.text}`}
                className="checklist-item flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => {
                    void handleCheckToggle(
                      section.title,
                      itemIndex,
                      item.checked,
                    );
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className={`flex-1 ${item.checked ? 'checked line-through text-gray-500' : 'text-gray-800'}`}>
                  {item.text}
                </span>
                <button
                  className="go-button px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  onClick={() => handleGoClick(item.text)}
                >
                  Go
                </button>
                <button
                  className="delete-button px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  onClick={() => {
                    void handleDeleteClick(section.title, itemIndex);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <div className="add-item-form flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Add new item..."
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => void handleAddItem(section.title)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
