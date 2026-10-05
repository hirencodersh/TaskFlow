import {
  useState,
} from 'react';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

import {
  logout,
} from '../modules/auth/auth.api';

import {
  useAuthStore,
} from '../store/auth.store';

import {
  disconnectSocket,
} from '../lib/socket';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const user = useAuthStore(
    (state) => state.user,
  );

  const clearAuth = useAuthStore(
    (state) => state.clearAuth,
  );

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Clear local auth even if
      // API logout fails.
    } finally {
      disconnectSocket();
      clearAuth();
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        userRole={user.role}
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="app-main">
        <Header
          userName={user.name}
          userRole={user.role}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={handleLogout}
        />

        <main className="app-content">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label="Close menu"
        />
      )}
    </div>
  );
}