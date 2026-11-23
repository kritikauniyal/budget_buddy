import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertTriangle, AlertOctagon, Info, CheckCircle2 } from "lucide-react";
import api from "../../services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="module-page">
      <div className="welcome-section">
        <div>
          <h2>Notifications</h2>
          <p>Helpful alerts on your monthly budget limits and shared group expenses.</p>
        </div>

        {unreadCount > 0 && (
          <button className="secondary-button" onClick={handleMarkAll}>
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "40px", color: "#8a90a2" }}>
            <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p>You have no new notifications. All alerts are cleared!</p>
          </div>
        ) : (
          notifications.map((note) => {
            const isDanger = note.type === "budget_exceeded";
            const isWarning = note.type === "budget_warning";

            return (
              <div
                key={note.id}
                className={`notification-item-card ${note.is_read ? "read" : "unread"} ${isDanger ? "danger" : isWarning ? "warning" : ""}`}
                onClick={() => !note.is_read && handleMarkRead(note.id)}
              >
                <div className="note-icon-col">
                  {isDanger ? (
                    <AlertOctagon size={20} className="text-danger" />
                  ) : isWarning ? (
                    <AlertTriangle size={20} className="text-warning" />
                  ) : (
                    <Info size={20} className="text-info" />
                  )}
                </div>

                <div className="note-content-col">
                  <div className="note-header-line">
                    <strong>{note.title}</strong>
                    <span className="note-time">{note.created_at}</span>
                  </div>
                  <p>{note.message}</p>
                </div>

                {!note.is_read && <span className="unread-dot" title="Unread notification" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

