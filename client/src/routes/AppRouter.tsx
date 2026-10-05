import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import LoginPage from '../modules/auth/LoginPage';
import {
  useAuthStore,
} from '../store/auth.store';

export default function AppRouter() {
  const user = useAuthStore(
    (state) => state.user,
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to="/"
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/"
        element={
          user ? (
            <main className="app">
              <h1>
                Welcome, {user.name}
              </h1>

              <p>
                Role: {user.role}
              </p>

              <p>
                Email: {user.email}
              </p>
            </main>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />
    </Routes>
  );
}