import { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Plus,
  X,
} from 'lucide-react';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  createAdminUser,
  deleteAdminUser,
  type AdminUser,
} from './admin.api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] =
    useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<
    'PROJECT_MANAGER' | 'DEVELOPER'
  >('DEVELOPER');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  useEffect(() => {
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
    } catch (error: unknown) {
      console.error(
        'Failed to update user status:',
        error,
      );

      const message =
        (
          error as {
            response?: {
              data?: { message?: string };
            };
          }
        )?.response?.data?.message ??
        'Unable to update user status. Please try again.';

      alert(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(
    userId: string,
    userName: string,
  ) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setUpdatingUserId(userId);

      await deleteAdminUser(userId);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id !== userId,
        ),
      );
    } catch (error: unknown) {
      console.error(
        'Failed to delete user:',
        error,
      );

      const message =
        (
          error as {
            response?: {
              data?: { message?: string };
            };
          }
        )?.response?.data?.message ??
        'Unable to delete user. Please try again.';

      alert(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleCreateUser(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !createName.trim() ||
      !createEmail.trim() ||
      !createPassword.trim()
    ) {
      setCreateError('All fields are required.');
      return;
    }

    if (createPassword.length < 8) {
      setCreateError(
        'Password must be at least 8 characters.',
      );
      return;
    }

    try {
      setIsCreating(true);
      setCreateError('');

      await createAdminUser({
        name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
      });

      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('DEVELOPER');
      setShowCreateModal(false);

      await loadUsers();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: {
              data?: { message?: string };
            };
          }
        )?.response?.data?.message ??
        'Failed to create user. Please try again.';

      setCreateError(message);
    } finally {
      setIsCreating(false);
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

        <button
          type="button"
          className="add-project-member-button"
          onClick={() => {
            setCreateError('');
            setShowCreateModal(true);
          }}
        >
          <Plus size={16} /> Add User
        </button>
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

            {users
              .slice()
              .sort((a, b) => {
                const roleWeight: Record<
                  string,
                  number
                > = {
                  ADMIN: 1,
                  PROJECT_MANAGER: 2,
                  DEVELOPER: 3,
                };

                const weightA =
                  roleWeight[a.role] ?? 99;
                const weightB =
                  roleWeight[b.role] ?? 99;

                if (weightA !== weightB) {
                  return weightA - weightB;
                }

                return a.name.localeCompare(b.name);
              })
              .map((user) => (
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

                  <button
                    type="button"
                    disabled={
                      updatingUserId === user.id
                    }
                    className="admin-status-action admin-status-delete"
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                    }}
                    onClick={() =>
                      handleDeleteUser(
                        user.id,
                        user.name,
                      )
                    }
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {showCreateModal ? (
        <div className="add-member-modal">
          <div className="add-member-modal-card">
            <div className="add-member-modal-header">
              <h2>Add New User</h2>

              <button
                type="button"
                onClick={() =>
                  !isCreating &&
                  setShowCreateModal(false)
                }
                disabled={isCreating}
              >
                <X size={20} />
              </button>
            </div>

            {createError ? (
              <p className="form-error">{createError}</p>
            ) : null}

            <form onSubmit={handleCreateUser}>
              <div className="project-form-group">
                <label htmlFor="create-name">
                  Full Name
                </label>
                <input
                  id="create-name"
                  type="text"
                  placeholder="John Doe"
                  value={createName}
                  onChange={(e) =>
                    setCreateName(e.target.value)
                  }
                  disabled={isCreating}
                />
              </div>

              <div className="project-form-group">
                <label htmlFor="create-email">
                  Email Address
                </label>
                <input
                  id="create-email"
                  type="email"
                  placeholder="john@example.com"
                  value={createEmail}
                  onChange={(e) =>
                    setCreateEmail(e.target.value)
                  }
                  disabled={isCreating}
                />
              </div>

              <div className="project-form-group">
                <label htmlFor="create-password">
                  Password
                </label>
                <input
                  id="create-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={createPassword}
                  onChange={(e) =>
                    setCreatePassword(e.target.value)
                  }
                  disabled={isCreating}
                />
              </div>

              <div className="project-form-group">
                <label htmlFor="create-role">
                  Role
                </label>
                <select
                  id="create-role"
                  value={createRole}
                  onChange={(e) =>
                    setCreateRole(
                      e.target.value as
                        | 'PROJECT_MANAGER'
                        | 'DEVELOPER',
                    )
                  }
                  disabled={isCreating}
                >
                  <option value="DEVELOPER">
                    Developer
                  </option>
                  <option value="PROJECT_MANAGER">
                    Project Manager
                  </option>
                </select>
              </div>

              <div className="add-member-modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    !isCreating &&
                    setShowCreateModal(false)
                  }
                  disabled={isCreating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isCreating ||
                    !createName.trim() ||
                    !createEmail.trim() ||
                    !createPassword.trim()
                  }
                >
                  {isCreating
                    ? 'Creating...'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
