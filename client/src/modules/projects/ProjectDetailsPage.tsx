import {
    useEffect,
    useState,
} from 'react';

import {
    Link,
    useParams,
} from 'react-router-dom';

import {
    ArrowLeft,
    Calendar,
    Clock,
    FolderKanban,
    Plus,
    Shield,
    Tag,
    Trash2,
    Users,
    X,
    Edit3,
    Activity,
} from 'lucide-react';

import {
    getProjectActivityLogs,
    type ActivityLog,
} from '../tasks/activity.api';

import {
    joinProject,
    leaveProject,
    socket,
} from '../../lib/socket';

import { useAuthStore } from '../../store/auth.store';

import {
    getProjectById,
    getProjectMembers,
    getUsers,
    addProjectMember,
    removeProjectMember,
    type Project,
    type ProjectMember,
    type AvailableUser,
} from './projects.api';

import {
    createLabel,
    deleteLabel,
    getProjectLabels,
    updateLabel,
    type Label,
} from '../tasks/tasks.api';

function formatActivityTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const diffInSeconds = Math.floor(
        (now.getTime() - date.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(
        diffInSeconds / 60,
    );

    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'
            } ago`;
    }

    const diffInHours = Math.floor(
        diffInMinutes / 60,
    );

    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'
            } ago`;
    }

    const diffInDays = Math.floor(
        diffInHours / 24,
    );

    if (diffInDays === 1) {
        return 'Yesterday';
    }

    return date.toLocaleDateString();
}

export default function ProjectDetailsPage() {
    const { projectId } = useParams();

    const user = useAuthStore(
        (state) => state.user,
    );

    const [project, setProject] =
        useState<Project | null>(null);

    const [labels, setLabels] =
        useState<Label[]>([]);

    const [labelName, setLabelName] =
        useState('');

    const [labelColor, setLabelColor] =
        useState('#6366f1');

    const [labelError, setLabelError] =
        useState('');

    const [labelSubmitting, setLabelSubmitting] =
        useState(false);

    const [members, setMembers] =
        useState<ProjectMember[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const canManageLabels =
        user?.role === 'ADMIN' ||
        (user?.role === 'PROJECT_MANAGER' &&
            project?.ownerId === user.id);

    const [users, setUsers] =
        useState<AvailableUser[]>([]);

    const [showAddMember, setShowAddMember] =
        useState(false);

    const [selectedUserId, setSelectedUserId] =
        useState('');

    const [addingMember, setAddingMember] =
        useState(false);

    const [memberError, setMemberError] =
        useState('');

    const [activityLogs, setActivityLogs] =
        useState<ActivityLog[]>([]);

    const [activityPage, setActivityPage] =
        useState(1);

    const [activityTotalPages, setActivityTotalPages] =
        useState(1);

    const [editingLabelId, setEditingLabelId] =
        useState<string | null>(null);

    async function handleCreateLabel() {
        if (!projectId) {
            return;
        }

        if (!labelName.trim()) {
            setLabelError(
                'Label name is required.',
            );
            return;
        }

        try {
            setLabelSubmitting(true);
            setLabelError('');

            const response =
                await createLabel({
                    projectId,
                    name: labelName.trim(),
                    color: labelColor,
                });

            setLabels((current) => [
                ...current,
                response.data.label,
            ]);

            setLabelName('');
            setLabelColor('#6366f1');
        } catch {
            setLabelError(
                'Failed to create label.',
            );
        } finally {
            setLabelSubmitting(false);
        }
    }

    async function handleUpdateLabel(
        labelId: string,
    ) {
        if (!labelName.trim()) {
            setLabelError(
                'Label name is required.',
            );
            return;
        }

        try {
            setLabelSubmitting(true);
            setLabelError('');

            const response =
                await updateLabel(labelId, {
                    name: labelName.trim(),
                    color: labelColor,
                });

            setLabels((current) =>
                current.map((label) =>
                    label.id === labelId
                        ? response.data.label
                        : label,
                ),
            );

            setLabelName('');
            setLabelColor('#6366f1');
            setEditingLabelId(null);
        } catch {
            setLabelError(
                'Failed to update label.',
            );
        } finally {
            setLabelSubmitting(false);
        }
    }

    async function handleDeleteLabel(
        labelId: string,
    ) {
        try {
            setLabelSubmitting(true);
            setLabelError('');

            await deleteLabel(labelId);

            setLabels((current) =>
                current.filter(
                    (label) =>
                        label.id !== labelId,
                ),
            );
        } catch {
            setLabelError(
                'Failed to delete label.',
            );
        } finally {
            setLabelSubmitting(false);
        }
    }

    useEffect(() => {
        async function loadProjectDetails() {
            if (!projectId) {
                return;
            }

            try {
                setLoading(true);
                setError('');

                const projectResponse =
                    await getProjectById(projectId);

                setProject(
                    projectResponse.data.project,
                );

                const membersResponse =
                    await getProjectMembers(
                        projectId,
                    );

                setMembers(
                    membersResponse.data.members,
                );

                const labelsResponse =
                    await getProjectLabels(
                        projectId,
                    );

                setLabels(
                    labelsResponse.data.labels,
                );

                const activityResponse =
                    await getProjectActivityLogs(
                        projectId,
                        activityPage,
                        10,
                    );

                setActivityLogs(
                    activityResponse.data.logs,
                );

                setActivityTotalPages(
                    activityResponse.data.pagination.totalPages,
                );
            } catch {
                setError(
                    'Failed to load project details.',
                );
            } finally {
                setLoading(false);
            }
        }

        loadProjectDetails();
    }, [projectId, activityPage]);

    useEffect(() => {
        if (!projectId) {
            return;
        }

        joinProject(projectId);

        const handleActivityLogCreated = (
            activityLog: ActivityLog,
        ) => {
            setActivityLogs((currentLogs) => [
                activityLog,
                ...currentLogs,
            ]);
        };

        socket.on(
            'activity-log-created',
            handleActivityLogCreated,
        );

        return () => {
            socket.off(
                'activity-log-created',
                handleActivityLogCreated,
            );

            leaveProject(projectId);
        };
    }, [projectId]);

    async function handleOpenAddMember() {
        if (!projectId) {
            return;
        }

        try {
            setMemberError('');

            const response =
                await getUsers(projectId);

            const existingMemberIds =
                members.map(
                    (member) => member.userId,
                );

            const availableUsers =
                response.data.users.filter(
                    (availableUser) =>
                        !existingMemberIds.includes(
                            availableUser.id,
                        ),
                );

            setUsers(availableUsers);
            setSelectedUserId('');
            setShowAddMember(true);
        } catch {
            setMemberError(
                'Failed to load users.',
            );
            setShowAddMember(true);
        }
    }

    function handleCloseAddMember() {
        if (addingMember) {
            return;
        }

        setShowAddMember(false);
        setSelectedUserId('');
        setMemberError('');
    }

    async function handleAddMember() {
        if (!projectId || !selectedUserId) {
            return;
        }

        try {
            setAddingMember(true);
            setMemberError('');

            await addProjectMember(
                projectId,
                {
                    userId: selectedUserId,
                },
            );

            const membersResponse =
                await getProjectMembers(
                    projectId,
                );

            setMembers(
                membersResponse.data.members,
            );

            setShowAddMember(false);
            setSelectedUserId('');
        } catch {
            setMemberError(
                'Failed to add project member.',
            );
        } finally {
            setAddingMember(false);
        }
    }

    async function handleRemoveMember(
        memberUserId: string,
    ) {
        if (!projectId) {
            return;
        }

        try {
            await removeProjectMember(
                projectId,
                memberUserId,
            );

            const membersResponse =
                await getProjectMembers(
                    projectId,
                );

            setMembers(
                membersResponse.data.members,
            );
        } catch {
            setError(
                'Failed to remove project member.',
            );
        }
    }

    if (loading) {
        return (
            <section className="project-details-page">
                <div className="projects-state-card">
                    <FolderKanban size={28} />
                    <h3>Loading project...</h3>
                    <p>Please wait while project details are retrieved.</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="project-details-page">
                <div className="projects-state-card projects-error-state">
                    <h3>Unable to load project</h3>
                    <p className="form-error">{error}</p>
                    <Link
                        to="/projects"
                        className="project-back-link"
                        style={{ marginTop: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back to Projects
                    </Link>
                </div>
            </section>
        );
    }

    if (!project) {
        return (
            <section className="project-details-page">
                <div className="projects-state-card">
                    <FolderKanban size={28} />
                    <h3>Project not found</h3>
                    <p>The requested project does not exist or you lack permission to view it.</p>
                    <Link
                        to="/projects"
                        className="project-back-link"
                        style={{ marginTop: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back to Projects
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="project-details-page">
            <div className="project-details-header">
                <div>
                    <Link
                        to="/projects"
                        className="project-back-link"
                    >
                        <ArrowLeft size={16} /> Back to Projects
                    </Link>

                    <h1>{project.name}</h1>

                    <p>
                        {project.description ||
                            'No description available for this project.'}
                    </p>
                </div>

                <span
                    className={`project-status project-status-${project.status.toLowerCase()}`}
                >
                    {project.status.replace(
                        '_',
                        ' ',
                    )}
                </span>
            </div>

            <div className="project-details-card">
                <div className="project-detail-item">
                    <span><FolderKanban size={14} /> Project ID</span>
                    <strong>{project.id}</strong>
                </div>

                <div className="project-detail-item">
                    <span>Status</span>
                    <strong>
                        {project.status.replace(
                            '_',
                            ' ',
                        )}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span><Calendar size={14} /> Start Date</span>
                    <strong>
                        {project.startDate
                            ? new Date(
                                project.startDate,
                            ).toLocaleDateString()
                            : 'Not set'}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span><Calendar size={14} /> Due Date</span>
                    <strong>
                        {project.dueDate
                            ? new Date(
                                project.dueDate,
                            ).toLocaleDateString()
                            : 'Not set'}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span><Clock size={14} /> Created</span>
                    <strong>
                        {new Date(
                            project.createdAt,
                        ).toLocaleDateString()}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span><Clock size={14} /> Last Updated</span>
                    <strong>
                        {new Date(
                            project.updatedAt,
                        ).toLocaleDateString()}
                    </strong>
                </div>
            </div>

            <div className="project-members-section">
                <div className="project-members-header">
                    <div>
                        <h2><Users size={18} /> Project Members</h2>
                        <p>
                            {members.length}{' '}
                            {members.length === 1
                                ? 'member'
                                : 'members'} collaborating on this project
                        </p>
                    </div>

                    {user?.role === 'ADMIN' ||
                        user?.role === 'PROJECT_MANAGER' ? (
                        <button
                            type="button"
                            className="add-project-member-button"
                            onClick={
                                handleOpenAddMember
                            }
                        >
                            <Plus size={16} /> Add Member
                        </button>
                    ) : null}
                </div>

                {members.length === 0 ? (
                    <div className="project-members-empty">
                        <Users size={24} />
                        <p>No members found for this project.</p>
                    </div>
                ) : (
                    <div className="project-members-list">
                        {members.map((member) => {
                            const memberRole =
                                member.role ||
                                member.user?.role ||
                                'MEMBER';

                            return (
                                <div
                                    key={member.id}
                                    className="project-member-card"
                                >
                                    <div className="project-member-info">
                                        <div className="project-member-avatar">
                                            {member.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <h3>
                                                {member.user.name}
                                            </h3>

                                            <p>
                                                {member.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="project-member-actions">
                                        <div className="project-member-role">
                                            <Shield size={13} />
                                            {memberRole.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </div>

                                        {user?.role === 'ADMIN' ||
                                            user?.role === 'PROJECT_MANAGER' ? (
                                            <button
                                                type="button"
                                                className="remove-project-member-button"
                                                onClick={() =>
                                                    handleRemoveMember(
                                                        member.userId,
                                                    )
                                                }
                                            >
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showAddMember ? (
                    <div className="add-member-modal">
                        <div className="add-member-modal-card">
                            <div className="add-member-modal-header">
                                <h2>
                                    Add Project Member
                                </h2>

                                <button
                                    type="button"
                                    onClick={
                                        handleCloseAddMember
                                    }
                                    disabled={
                                        addingMember
                                    }
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {memberError ? (
                                <p className="form-error">
                                    {memberError}
                                </p>
                            ) : null}

                            {users.length === 0 ? (
                                <p className="projects-state-card" style={{ minHeight: '120px', padding: '16px' }}>
                                    No available users to add.
                                </p>
                            ) : (
                                <div className="project-form-group">
                                    <label htmlFor="select-member">Select User</label>
                                    <select
                                        id="select-member"
                                        value={
                                            selectedUserId
                                        }
                                        onChange={(event) =>
                                            setSelectedUserId(
                                                event.target
                                                    .value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select a user...
                                        </option>

                                        {users.map(
                                            (
                                                availableUser,
                                            ) => (
                                                <option
                                                    key={
                                                        availableUser.id
                                                    }
                                                    value={
                                                        availableUser.id
                                                    }
                                                >
                                                    {
                                                        availableUser.name
                                                    }{' '}
                                                    (
                                                    {
                                                        availableUser.email
                                                    }
                                                    )
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            )}

                            <div className="add-member-modal-actions">
                                <button
                                    type="button"
                                    onClick={
                                        handleCloseAddMember
                                    }
                                    disabled={
                                        addingMember
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !selectedUserId ||
                                        addingMember
                                    }
                                    onClick={
                                        handleAddMember
                                    }
                                >
                                    {addingMember
                                        ? 'Adding...'
                                        : 'Add Member'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="project-details-card">
                <div className="project-details-section">
                    <h2><Tag size={18} /> Project Labels</h2>

                    {labelError ? (
                        <p className="form-error">
                            {labelError}
                        </p>
                    ) : null}

                    {canManageLabels ? (
                        <div className="project-label-form">
                            <input
                                type="text"
                                placeholder="Label name..."
                                value={labelName}
                                onChange={(event) =>
                                    setLabelName(
                                        event.target.value,
                                    )
                                }
                                disabled={labelSubmitting}
                            />

                            <input
                                type="color"
                                value={labelColor}
                                onChange={(event) =>
                                    setLabelColor(
                                        event.target.value,
                                    )
                                }
                                disabled={labelSubmitting}
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    if (editingLabelId) {
                                        handleUpdateLabel(
                                            editingLabelId,
                                        );
                                    } else {
                                        handleCreateLabel();
                                    }
                                }}
                                disabled={
                                    labelSubmitting ||
                                    !labelName.trim()
                                }
                            >
                                {labelSubmitting
                                    ? 'Saving...'
                                    : editingLabelId
                                        ? 'Update Label'
                                        : 'Add Label'}
                            </button>

                            {editingLabelId ? (
                                <button
                                    type="button"
                                    className="project-cancel-button"
                                    onClick={() => {
                                        setEditingLabelId(null);
                                        setLabelName('');
                                        setLabelColor('#6366f1');
                                        setLabelError('');
                                    }}
                                    disabled={labelSubmitting}
                                >
                                    Cancel
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    {labels.length === 0 ? (
                        <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                            No labels created for this project yet.
                        </p>
                    ) : (
                        <div className="project-labels-list">
                            {labels.map((label) => (
                                <div
                                    key={label.id}
                                    className="project-label-item"
                                >
                                    <div className="project-label-info">
                                        <span
                                            className="project-label-color"
                                            style={{
                                                backgroundColor:
                                                    label.color,
                                            }}
                                        />

                                        <strong>
                                            {label.name}
                                        </strong>
                                    </div>

                                    {canManageLabels ? (
                                        <div className="project-label-actions">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingLabelId(
                                                        label.id,
                                                    );
                                                    setLabelName(
                                                        label.name,
                                                    );
                                                    setLabelColor(
                                                        label.color,
                                                    );
                                                    setLabelError('');
                                                }}
                                                disabled={labelSubmitting}
                                            >
                                                <Edit3 size={13} /> Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteLabel(
                                                        label.id,
                                                    )
                                                }
                                                disabled={labelSubmitting}
                                            >
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <section className="project-section">
                <h2><Activity size={18} /> Activity Logs</h2>

                {activityLogs.length === 0 ? (
                    <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                        No activity logs recorded yet.
                    </p>
                ) : (
                    <div className="project-activity-list">
                        {activityLogs.map((log) => (
                            <div
                                key={log.id}
                                className="project-activity-item"
                            >
                                <div className="project-activity-main">
                                    <strong>
                                        {log.actor.name}
                                    </strong>

                                    <span className="project-activity-action">
                                        {log.action}
                                    </span>
                                </div>

                                {log.task ? (
                                    <div className="project-activity-task">
                                        Task:{' '}
                                        <Link to={`/tasks/${log.task.id}`}>
                                            {log.task.title}
                                        </Link>
                                    </div>
                                ) : null}
                                <small>
                                    <Clock size={12} /> {formatActivityTime(log.createdAt)}
                                </small>
                            </div>
                        ))}
                    </div>
                )}

                {activityTotalPages > 1 ? (
                    <div className="project-activity-pagination">
                        <button
                            type="button"
                            onClick={() =>
                                setActivityPage((currentPage) =>
                                    Math.max(currentPage - 1, 1),
                                )
                            }
                            disabled={activityPage === 1}
                        >
                            Previous
                        </button>

                        <span>
                            Page {activityPage} of{' '}
                            {activityTotalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setActivityPage((currentPage) =>
                                    Math.min(
                                        currentPage + 1,
                                        activityTotalPages,
                                    ),
                                )
                            }
                            disabled={
                                activityPage === activityTotalPages
                            }
                        >
                            Next
                        </button>
                    </div>
                ) : null}
            </section>
        </section>
    );
}
