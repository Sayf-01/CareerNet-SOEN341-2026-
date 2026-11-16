import { useEffect, useState } from "react";

import Alert from "../components/Alert";
import Loader from "../components/Loader";
import { getNotifications, markAllNotificationsRead } from "../api/notifications";
import type { AppNotification } from "../types/notification";

// Full list of the user's notifications, newest first (the backend sorts them).
function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load notifications.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark notifications as read.");
    }
  }

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Notifications</h1>
        {items.length > 0 && (
          <button type="button" onClick={() => void handleMarkAll()} disabled={!hasUnread}>
            Mark all as read
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && <p>No notifications yet</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((n) => (
            <li
              key={n.id}
              data-testid={`notification-${n.id}`}
              data-unread={!n.is_read}
              style={{
                padding: "12px 16px", marginBottom: "8px", borderRadius: "6px", border: "1px solid #d0d7de",
                backgroundColor: n.is_read ? "#ffffff" : "#ddf4ff", fontWeight: n.is_read ? "normal" : "bold",
              }}
            >
              <div>{n.message}</div>
              {n.interview_at && (
                <div style={{ fontSize: "14px", marginTop: "4px" }}>
                  Interview: {new Date(n.interview_at).toLocaleString()}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#57606a", marginTop: "4px", fontWeight: "normal" }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
