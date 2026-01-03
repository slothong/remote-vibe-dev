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
    if (!sessionId) return;

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
            checked: !currentChecked,
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
        setError(data.error || 'Failed to update check status');
      }
    } catch (err) {
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
    if (!sessionId) return;

    const itemText = newItemTexts[sectionTitle]?.trim();
    if (!itemText) return;

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
        // Clear input and refresh plan data
        setNewItemTexts(prev => ({...prev, [sectionTitle]: ''}));
        await fetchPlan();
      } else {
        setError(data.error || 'Failed to add item');
      }
    } catch (err) {
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
    return <div className="checklist-loading">Loading plan...</div>;
  }

  if (error) {
    return <div className="checklist-error">Error: {error}</div>;
  }

  if (!plan) {
    return <div className="checklist-empty">No plan data</div>;
  }

  return (
    <div className="checklist-container" data-testid="checklist-container">
      <h2>Plan Checklist</h2>
      {plan.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="checklist-section">
          <h3>{section.title}</h3>
          <ul className="checklist-items">
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex} className="checklist-item">
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
                />
                <span className={item.checked ? 'checked' : ''}>
                  {item.text}
                </span>
                <button
                  className="go-button"
                  onClick={() => handleGoClick(item.text)}
                >
                  Go
                </button>
                <button
                  className="delete-button"
                  onClick={() => {
                    void handleDeleteClick(section.title, itemIndex);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <div className="add-item-form">
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
            />
            <button onClick={() => void handleAddItem(section.title)}>
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
