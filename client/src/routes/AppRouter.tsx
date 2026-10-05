import {
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';

import LoginPage from '../modules/auth/LoginPage';
import DashboardPage from '../modules/dashboard/DashboardPage';
import ProjectsPage from '../modules/projects/ProjectsPage';
import TasksPage from '../modules/tasks/TasksPage';
import AdminUsersPage from '../modules/admin/AdminUsersPage';
import ProjectDetailsPage from '../modules/projects/ProjectDetailsPage';
import TaskDetailsPage from '../modules/tasks/TaskDetailsPage';

import AppLayout from '../layouts/AppLayout';

import {
  useAuthStore,
} from '../store/auth.store';

function TaskDetailsRoute() {
  const { taskId } = useParams();

  return (
    <TaskDetailsPage
      taskId={taskId ?? ''}
    />
  );
}

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
            <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/"
        element={
          user ? (
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />
      <Route
  path="/tasks/:taskId"
  element={
    user ? (
      <AppLayout>
        <TaskDetailsRoute />
      </AppLayout>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

      <Route
        path="/projects"
        element={
          user ? (
            <AppLayout>
              <ProjectsPage />
            </AppLayout>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          user ? (
            <AppLayout>
              <ProjectDetailsPage />
            </AppLayout>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      <Route
        path="/tasks"
        element={
          user ? (
            <AppLayout>
              <TasksPage />
            </AppLayout>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      <Route
        path="/tasks/:taskId"
        element={
          user ? (
            <AppLayout>
              <TaskDetailsPage
                taskId={
                  useParams().taskId ?? ''
                }
              />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/admin/users"
        element={
          user?.role === 'ADMIN' ? (
            <AppLayout>
              <AdminUsersPage />
            </AppLayout>
          ) : (
            <Navigate
              to="/"
              replace
            />
          )
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={user ? '/' : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}