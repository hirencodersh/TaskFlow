import {
    useEffect,
    useState,
} from 'react';

import {
    Link,
    useParams,
} from 'react-router-dom';

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

export default function ProjectDetailsPage() {
    const { projectId } = useParams();

    const user = useAuthStore(
        (state) => state.user,
    );

    const [project, setProject] =
        useState<Project | null>(null);

    const [members, setMembers] =
        useState<ProjectMember[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

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

    useEffect(() => {
        async function loadProjectDetails() {
            if (!projectId) {
                setError('Project ID is missing.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const [
                    projectResponse,
                    membersResponse,
                ] = await Promise.all([
                    getProjectById(projectId),
                    getProjectMembers(projectId),
                ]);

                setProject(
                    projectResponse.data.project,
                );

                setMembers(
                    membersResponse.data.members,
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
    }, [projectId]);

    async function handleOpenAddMember() {
        try {
            setMemberError('');

            const response = await getUsers();

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
                <p>Loading project...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="project-details-page">
                <p className="form-error">
                    {error}
                </p>

                <Link
                    to="/projects"
                    className="project-back-link"
                >
                    ← Back to Projects
                </Link>
            </section>
        );
    }

    if (!project) {
        return (
            <section className="project-details-page">
                <p>Project not found.</p>

                <Link
                    to="/projects"
                    className="project-back-link"
                >
                    ← Back to Projects
                </Link>
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
                        ← Back to Projects
                    </Link>

                    <h1>{project.name}</h1>

                    <p>
                        {project.description ||
                            'No description available.'}
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
                    <span>Project ID</span>
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
                    <span>Start Date</span>
                    <strong>
                        {project.startDate
                            ? new Date(
                                project.startDate,
                            ).toLocaleDateString()
                            : 'Not set'}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span>Due Date</span>
                    <strong>
                        {project.dueDate
                            ? new Date(
                                project.dueDate,
                            ).toLocaleDateString()
                            : 'Not set'}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span>Created</span>
                    <strong>
                        {new Date(
                            project.createdAt,
                        ).toLocaleDateString()}
                    </strong>
                </div>

                <div className="project-detail-item">
                    <span>Last Updated</span>
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
                        <h2>Project Members</h2>

                        <p>
                            {members.length}{' '}
                            {members.length === 1
                                ? 'member'
                                : 'members'}
                        </p>
                    </div>

                    {user?.role === 'ADMIN' ||
                        user?.role === 'PROJECT_MANAGER' ? (
                        <button
                            type="button"
                            className="add-project-member-button"
                            onClick={handleOpenAddMember}
                        >
                            + Add Member
                        </button>
                    ) : null}
                </div>

                {members.length === 0 ? (
                    <div className="project-members-empty">
                        <p>
                            No members found for this
                            project.
                        </p>
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
                                                Remove
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
                                    disabled={addingMember}
                                >
                                    ×
                                </button>
                            </div>

                            {memberError ? (
                                <p className="form-error">
                                    {memberError}
                                </p>
                            ) : null}

                            {users.length === 0 ? (
                                <p>
                                    No available users to
                                    add.
                                </p>
                            ) : (
                                <select
                                    value={selectedUserId}
                                    onChange={(event) =>
                                        setSelectedUserId(
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        Select a user
                                    </option>

                                    {users.map(
                                        (availableUser) => (
                                            <option
                                                key={
                                                    availableUser.id
                                                }
                                                value={
                                                    availableUser.id
                                                }
                                            >
                                                {availableUser.name}{' '}
                                                (
                                                {
                                                    availableUser.email
                                                }
                                                )
                                            </option>
                                        ),
                                    )}
                                </select>
                            )}

                            <div className="add-member-modal-actions">
                                <button
                                    type="button"
                                    onClick={
                                        handleCloseAddMember
                                    }
                                    disabled={addingMember}
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
        </section>
    );
}