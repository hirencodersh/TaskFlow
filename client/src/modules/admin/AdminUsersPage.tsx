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
  Eye,
  Sliders,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminUserPermissions,
  approveAdminUser,
  createAdminUser,
  deleteAdminUser,
  type AdminUser,
  type UserRole,
} from './admin.api';
import { useAuthStore } from '../../store/auth.store';

export default function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] =
    useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);
  const [isDetailLoading, setIsDetailLoading] =
    useState(false);

  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [approveRole, setApproveRole] = useState<UserRole>('DEVELOPER');

  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] =
    useState<UserRole>('DEVELOPER');
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
    role: UserRole,
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

      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, role: response.data.role } : null,
        );
      }
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

  async function handleApprove(userId: string) {
    try {
      setUpdatingUserId(userId);
      const response = await approveAdminUser(userId, approveRole);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                isActive: response.data.user.isActive,
                role: response.data.user.role,
              }
            : user,
        ),
      );
      setApprovingUserId(null);
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Unable to approve user.');
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

      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, isActive: response.data.isActive } : null,
        );
      }
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

  async function handlePermissionToggle(
    userId: string,
    permissionKey: string,
    currentValue: boolean,
  ) {
    try {
      const currentPermissions =
        selectedUser?.permissions ?? {};
      const updatedPermissions = {
        ...currentPermissions,
        [permissionKey]: !currentValue,
      };

      const response =
        await updateAdminUserPermissions(
          userId,
          { permissions: updatedPermissions },
        );

      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              permissions: response.data.permissions,
            }
          : null,
      );
    } catch (error) {
      console.error(
        'Failed to update permissions:',
        error,
      );
      alert('Failed to update permission override.');
    }
  }

  async function handleOpenDetails(userId: string) {
    try {
      setIsDetailLoading(true);
      const response = await getAdminUserById(userId);
      setSelectedUser(response.data);
    } catch (error) {
      console.error(
        'Failed to load user details:',
        error,
      );
      alert('Unable to load user details.');
    } finally {
      setIsDetailLoading(false);
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

      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
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
      <div className="admin-users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1><Users size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Users Management</h1>
          <p>
            Manage TaskFlow system users, registrations, roles, and access permissions.
          </p>
        </div>

        {/* Add User button aligned to table header / header right side */}
        <button
          type="button"
          className="create-task-button"
          onClick={() => {
            setCreateError('');
            setShowCreateModal(true);
          }}
        >
          <Plus size={17} /> Add User
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
                if (a.isActive !== b.isActive) {
                  return a.isActive ? 1 : -1;
                }

                const roleWeight: Record<
                  string,
                  number
                > = {
                  ADMIN: 1,
                  PROJECT_MANAGER: 2,
                  DEVELOPER: 3,
                  DESIGNER: 4,
                  QA: 5,
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
              .map((user) => {
                const isCurrentAdmin = user.id === currentUser?.id;
                return (
              <div
                key={user.id}
                className="admin-user-row"
              >
                <span>
                  <div className="admin-user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name} {isCurrentAdmin && <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600, marginLeft: '6px' }}>(You)</span>}
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
                      : 'Pending'}
                  </span>
                </span>

                <span className="admin-user-actions">
                  {isCurrentAdmin ? (
                    <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
                      Current Admin (No actions)
                    </span>
                  ) : !user.isActive ? (
                    <>
                      <button
                        type="button"
                        className="admin-status-action"
                        style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                        onClick={() => setApprovingUserId(user.id)}
                      >
                        <CheckCheck size={14} /> Accept
                      </button>
                      <button
                        type="button"
                        className="admin-status-action admin-status-delete"
                        style={{ background: '#ef4444', color: '#ffffff' }}
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="admin-status-action"
                        style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                        onClick={() => handleOpenDetails(user.id)}
                      >
                        <Eye size={14} /> Details
                      </button>

                      <select
                        value={user.role}
                        disabled={
                          updatingUserId === user.id
                        }
                        onChange={(event) =>
                          handleRoleChange(
                            user.id,
                            event.target.value as UserRole,
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

                        <option value="DESIGNER">
                          Designer
                        </option>

                        <option value="QA">
                          QA
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
                    </>
                  )}
                </span>
              </div>
            );
          })}
          </>
        )}
      </div>

      {/* Accept / Role Assignment Modal for Pending User */}
      {approvingUserId && (
        <div className="add-member-modal">
          <div className="add-member-modal-card">
            <div className="add-member-modal-header">
              <h2>Approve & Assign Role</h2>
              <button type="button" onClick={() => setApprovingUserId(null)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Select a position/role for this user before activating their account:
            </p>
            <div className="project-form-group">
              <label htmlFor="approve-role">Role / Position</label>
              <select
                id="approve-role"
                value={approveRole}
                onChange={(e) => setApproveRole(e.target.value as UserRole)}
              >
                <option value="DEVELOPER">Developer</option>
                <option value="DESIGNER">Designer</option>
                <option value="QA">QA</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="add-member-modal-actions">
              <button type="button" onClick={() => setApprovingUserId(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprove(approvingUserId)}
                disabled={updatingUserId === approvingUserId}
              >
                {updatingUserId === approvingUserId ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="add-member-modal">
          <div className="add-member-modal-card" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="add-member-modal-header">
              <h2>User Details: {selectedUser.name}</h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
              >
                <X size={20} />
              </button>
            </div>

            {isDetailLoading ? (
              <p style={{ textAlign: 'center', padding: '30px' }}>Loading user details...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Email</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{selectedUser.email}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Role</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{selectedUser.role.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Status</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{selectedUser.isActive ? 'Active' : 'Pending'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Joined</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Task Statistics */}
                {selectedUser.stats && (
                  <div>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Task Statistics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Total Assigned</span>
                        <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>{selectedUser.stats.totalAssigned}</strong>
                      </div>
                      <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', textAlign: 'center', color: '#047857' }}>
                        <span style={{ fontSize: '11px', color: '#059669' }}>Completed</span>
                        <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>{selectedUser.stats.completedTasks}</strong>
                      </div>
                      <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center', color: '#2563eb' }}>
                        <span style={{ fontSize: '11px', color: '#3b82f6' }}>In Progress</span>
                        <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>{selectedUser.stats.inProgressTasks}</strong>
                      </div>
                      <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '8px', textAlign: 'center', color: '#c2410c' }}>
                        <span style={{ fontSize: '11px', color: '#ea580c' }}>To Do</span>
                        <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>{selectedUser.stats.todoTasks}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Involvement */}
                {selectedUser.projectMemberships && selectedUser.projectMemberships.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Project Involvement</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedUser.projectMemberships.map((m) => (
                        <div key={m.project.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{m.project.name}</span>
                          <span className={`project-status project-status-${m.project.status.toLowerCase()}`}>{m.project.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permission Overrides */}
                <div>
                  <h3 style={{ fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={16} /> Permission Overrides
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'canCreateProjects', label: 'Create Projects' },
                      { key: 'canManageMembers', label: 'Manage Members' },
                      { key: 'canDeleteTasks', label: 'Delete Tasks' },
                      { key: 'canAssignTasks', label: 'Assign Tasks' },
                    ].map((perm) => {
                      const enabled = selectedUser.permissions?.[perm.key] ?? true;
                      return (
                        <div
                          key={perm.key}
                          onClick={() => handlePermissionToggle(selectedUser.id, perm.key, enabled)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: enabled ? '#eef2ff' : '#f8fafc',
                            border: `1px solid ${enabled ? '#c7d2fe' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{perm.label}</span>
                          <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: enabled ? '#4f46e5' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            {enabled && <Check size={14} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                      e.target.value as UserRole,
                    )
                  }
                  disabled={isCreating}
                >
                  <option value="DEVELOPER">
                    Developer
                  </option>
                  <option value="DESIGNER">
                    Designer
                  </option>
                  <option value="QA">
                    QA
                  </option>
                  <option value="PROJECT_MANAGER">
                    Project Manager
                  </option>
                  <option value="ADMIN">
                    Admin
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
