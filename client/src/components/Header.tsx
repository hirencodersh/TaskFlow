import {
  Menu,
  LogOut,
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationItem,
  type NotificationItem,
} from '../modules/notifications/notifications.api';
import { socket } from '../lib/socket';

type HeaderProps = {
  userName: string;
  userRole: string;
  onMenuClick: () => void;
  onLogout: () => void;
};

export default function Header({
  userName,
  userRole,
  onMenuClick,
  onLogout,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  async function loadNotifications(filterUnread?: boolean) {
    try {
      setLoading(true);
      setError('');
      const response = await getNotifications({
        unreadOnly: filterUnread,
        limit: 20,
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(unreadOnly);

    function handleNewNotification(newNotif: NotificationItem) {
      setNotifications((current) => [newNotif, ...current]);
      setUnreadCount((current) => current + 1);
    }

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [unreadOnly]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkAsRead(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      console.error('Failed to mark notification as read');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((n) => ({ ...n, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      console.error('Failed to mark all as read');
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const target = notifications.find((n) => n.id === id);
      await deleteNotificationItem(id);
      setNotifications((current) => current.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch {
      console.error('Failed to delete notification');
    }
  }

  function handleNotificationClick(item: NotificationItem) {
    if (!item.isRead) {
      markNotificationRead(item.id).catch(() => {});
      setNotifications((current) =>
        current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  }

  return (
    <header className="app-header">
      <button
        type="button"
        className="menu-button"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              transition: 'background 0.2s ease',
            }}
            aria-label="Notifications"
          >
            <Bell size={20} color="var(--tf-text, #0f172a)" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '360px',
                background: '#ffffff',
                border: '1px solid var(--tf-border, #e2e8f0)',
                borderRadius: '16px',
                boxShadow: '0 15px 35px rgba(15, 23, 42, 0.12)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--tf-border, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} />
                  <strong style={{ fontSize: '15px' }}>Notifications</strong>
                  {unreadCount > 0 && (
                    <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !unreadOnly;
                      setUnreadOnly(next);
                      loadNotifications(next);
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: unreadOnly ? '#4f46e5' : '#fff',
                      color: unreadOnly ? '#fff' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Unread
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCheck size={12} /> Read All
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Loading notifications...
                  </div>
                ) : error ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>
                    {error}
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    <CheckCircle2 size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No notifications</p>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>You're all caught up!</span>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        background: item.isRead ? '#ffffff' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.isRead ? 'transparent' : '#4f46e5',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.title}</strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                          {item.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', fontWeight: 650, cursor: 'pointer', padding: 0 }}
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(item.id, e)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 650, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="header-user-info">
            <span className="header-user-name">
              {userName}
            </span>

            <span className="header-user-role">
              {userRole.replace('_', ' ')}
            </span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
