import {
  Menu,
  LogOut,
} from 'lucide-react';

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
    </header>
  );
}