import { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUser,
} from './admin.api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        setError('');

        const response = await getAdminUsers();

        setUsers(response.data.users);
      } catch (error) {
        console.error(
          'Failed to load users:',
          error,
        );

        setError(
          'Unable to load users. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  async function handleRoleChange(
    userId: string,
    role:
      | 'ADMIN'
      | 'PROJECT_MANAGER'
      | 'DEVELOPER',
  ) {
    try {
      setUpdatingUserId(userId);

      const response =
        await updateAdminUserRole(
          userId,
          { role },
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: response.data.role,
              }
            : user,
        ),
      );
    } catch (error) {
      console.error(
        'Failed to update user role:',
        error,
      );

      alert(
        'Unable to update user role. Please try again.',
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleStatusChange(
    userId: string,
    isActive: boolean,
  ) {
    try {
      setUpdatingUserId(userId);

      const response =
        await updateAdminUserStatus(
          userId,
          { isActive },
        );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                isActive:
                  response.data.isActive,
              }
            : user,
        ),
      );
    } catch (error) {
      console.error(
        'Failed to update user status:',
        error,
      );

      alert(
        'Unable to update user status. Please try again.',
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <section className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1><Users size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Users Management</h1>
          <p>
            Manage TaskFlow system users, roles, and access permissions.
          </p>
        </div>
      </div>

      <div className="admin-users-card">
        {isLoading ? (
          <div className="admin-users-empty">
            <Users size={32} />
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="admin-users-empty admin-users-error">
            <XCircle size={32} />
            <p>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-users-empty">
            <Users size={32} />
            <p>No users found in the system.</p>
          </div>
        ) : (
          <>
            <div className="admin-users-table-header">
              <span><UserIcon size={13} /> Name</span>
              <span><Mail size={13} /> Email</span>
              <span><Shield size={13} /> Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {users.map((user) => (
              <div
                key={user.id}
                className="admin-user-row"
              >
                <span>
                  <div className="admin-user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name}
                </span>

                <span>{user.email}</span>

                <span>
                  <span
                    className={`admin-role-badge admin-role-${user.role
                      .toLowerCase()
                      .replace('_', '-')}`}
                  >
                    <Shield size={11} /> {user.role.replace('_', ' ')}
                  </span>
                </span>

                <span>
                  <span
                    className={
                      user.isActive
                        ? 'admin-status-badge admin-status-active'
                        : 'admin-status-badge admin-status-inactive'
                    }
                  >
                    {user.isActive ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {user.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </span>

                <span className="admin-user-actions">
                  <select
                    value={user.role}
                    disabled={
                      updatingUserId === user.id
                    }
                    onChange={(event) =>
                      handleRoleChange(
                        user.id,
                        event.target.value as
                          | 'ADMIN'
                          | 'PROJECT_MANAGER'
                          | 'DEVELOPER',
                      )
                    }
                    className="admin-role-select"
                  >
                    <option value="ADMIN">
                      Admin
                    </option>

                    <option value="PROJECT_MANAGER">
                      Project Manager
                    </option>

                    <option value="DEVELOPER">
                      Developer
                    </option>
                  </select>

                  <button
                    type="button"
                    disabled={
                      updatingUserId === user.id
                    }
                    className={
                      user.isActive
                        ? 'admin-status-action admin-status-deactivate'
                        : 'admin-status-action admin-status-activate'
                    }
                    onClick={() =>
                      handleStatusChange(
                        user.id,
                        !user.isActive,
                      )
                    }
                  >
                    {user.isActive
                      ? 'Deactivate'
                      : 'Activate'}
                  </button>
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
