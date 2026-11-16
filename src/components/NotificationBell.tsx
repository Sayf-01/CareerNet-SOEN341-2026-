import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getNotifications, markNotificationRead, notificationLink } from "../api/notifications";
import type { AppNotification } from "../types/notification";

const REFRESH_MS = 60_000;

// Bell in the navbar: unread count, refreshed every minute, and a small
// panel with the 5 newest notifications.
function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const data = await getNotifications();
        if (!cancelled) {
          setItems(data.items);
          setUnread(data.unread_count);
        }
      } catch {
        // keep the last count, the bell is not the place for an error
      }
    }

    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function handleClick(notification: AppNotification) {
    setOpen(false);
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setUnread((n) => Math.max(0, n - 1));
        setItems((list) => list.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
      } catch {
        // still go to the page even if marking it read failed
      }
    }
    navigate(notificationLink(notification));
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", position: "relative" }}
      >
        🔔
        {unread > 0 && (
          <span
            data-testid="unread-badge"
            style={{
              position: "absolute", top: "-6px", right: "-10px", backgroundColor: "#cf222e", color: "#ffffff",
              borderRadius: "10px", padding: "0 6px", fontSize: "11px", fontWeight: "bold",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", right: 0, top: "32px", width: "300px", backgroundColor: "#ffffff", color: "#24292f",
            border: "1px solid #d0d7de", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10,
          }}
        >
          {items.length === 0 ? (
            <p style={{ padding: "12px", margin: 0 }}>No notifications yet</p>
          ) : (
            items.slice(0, 5).map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                onClick={() => void handleClick(n)}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none",
                  borderBottom: "1px solid #eaeef2", cursor: "pointer", fontWeight: n.is_read ? "normal" : "bold",
                  backgroundColor: n.is_read ? "#ffffff" : "#ddf4ff",
                }}
              >
                {n.message}
              </button>
            ))
          )}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "10px 12px", color: "#0969da" }}
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
