import {
  BarChart3,
  FolderKanban,
  ListTodo,
  Users,
  X,
} from 'lucide-react';

import {
  Link,
} from 'react-router-dom';

import type {
  UserRole,
} from '../store/auth.store';

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
  return (
    <aside
      className={`sidebar ${
        isOpen ? 'sidebar-open' : ''
      }`}
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
    </aside>
  );
}