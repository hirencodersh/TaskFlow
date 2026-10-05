import {
  useEffect,
  useState,
} from 'react';

import {
  refresh,
} from './auth.api';

import {
  useAuthStore,
} from '../../store/auth.store';

import {
  connectSocket,
} from '../../lib/socket';

type Props = {
  children: React.ReactNode;
};

export default function AuthInitializer({
  children,
}: Props) {
  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  const clearAuth = useAuthStore(
    (state) => state.clearAuth,
  );

  const [isInitializing, setIsInitializing] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const response =
          await refresh();

        if (!mounted) {
          return;
        }

        setAuth(
          response.data.user,
          response.data.accessToken,
        );

        connectSocket(
          response.data.accessToken,
        );
      } catch {
        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [setAuth, clearAuth]);

  if (isInitializing) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>TaskFlow</h1>
            <p>
              Restoring your session...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}