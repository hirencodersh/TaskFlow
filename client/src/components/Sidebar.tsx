import {
  BarChart3,
  FolderKanban,
  ListTodo,
  Users,
  X,
  LogOut,
  Shield,
} from 'lucide-react';

import {
  Link,
} from 'react-router-dom';

import { useState } from 'react';
import { useAuthStore, type UserRole } from '../store/auth.store';
import { logout } from '../modules/auth/auth.api';
import { disconnectSocket } from '../lib/socket';

type SidebarProps = {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({
  userRole,
  isOpen,
  onClose,
}: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      disconnectSocket();
      clearAuth();
    }
  };

  return (
    <aside
      className={`sidebar ${
        isOpen ? 'sidebar-open' : ''
      }`}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          TaskFlow
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/"
          className="sidebar-link"
          onClick={onClose}
        >
          <BarChart3 size={20} />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/projects"
          className="sidebar-link"
          onClick={onClose}
        >
          <FolderKanban size={20} />
          <span>Projects</span>
        </Link>

        <Link
          to="/tasks"
          className="sidebar-link"
          onClick={onClose}
        >
          <ListTodo size={20} />
          <span>Tasks</span>
        </Link>

        {(userRole === 'ADMIN' || userRole === 'PROJECT_MANAGER') && (
          <Link
            to="/team"
            className="sidebar-link"
            onClick={onClose}
          >
            <Users size={20} />
            <span>Team</span>
          </Link>
        )}

        {userRole === 'ADMIN' && (
          <Link
            to="/admin/users"
            className="sidebar-link"
            onClick={onClose}
          >
            <Users size={20} />
            <span>Users</span>
          </Link>
        )}
      </nav>

      {user && (
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '12px 10px', borderTop: '1px solid #1e293b' }}>
          <button
            type="button"
            className="sidebar-link"
            onClick={() => setShowProfileModal(true)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '11px', flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span>My Profile</span>
          </button>
        </div>
      )}

      {showProfileModal && user && (
        <div className="add-member-modal" style={{ display: 'flex', position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.5)', zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
          <div className="add-member-modal-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div className="add-member-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>User Profile Details</h2>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#334155', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '20px' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Role</span>
                <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={14} /> {user.role.replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Account Status</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>Active</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
              >
                <LogOut size={15} /> Sign Out
              </button>

              <button
                type="button"
                className="create-project-submit"
                onClick={() => setShowProfileModal(false)}
                style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
