import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
    Link,
    useParams,
} from 'react-router-dom';

import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Tag,
    MessageSquare,
    Paperclip,
    Plus,
    Trash2,
    Edit3,
    FolderKanban,
    FileText,
    AlertCircle,
} from 'lucide-react';

import {
    assignLabelToTask,
    deleteTask,
    getProjectLabels,
    getTaskById,
    removeLabelFromTask,
    updateTask,
    type Label,
    type Task,
    type TaskPriority,
    type TaskStatus,
} from './tasks.api';

import {
    createTaskComment,
    getTaskComments,
    updateTaskComment,
    deleteTaskComment,
    type TaskComment,
} from './comments.api';

import {
    getTaskAttachments,
    uploadTaskAttachment,
    deleteTaskAttachment,
    type TaskAttachment,
} from './attachments.api';

import { useAuthStore } from '../../store/auth.store';

type TaskDetailsPageProps = {
    taskId?: string;
};

export default function TaskDetailsPage({
    taskId: propTaskId,
}: TaskDetailsPageProps) {
    const { taskId: paramTaskId } = useParams();
    const taskId = propTaskId || paramTaskId || '';
    const navigate = useNavigate();

    const currentUser = useAuthStore(
        (state) => state.user,
    );

    const isDeveloper =
        currentUser?.role === 'DEVELOPER';

    const canEditFullTask =
        currentUser?.role === 'ADMIN' ||
        currentUser?.role === 'PROJECT_MANAGER';

    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;

    const [task, setTask] =
        useState<Task | null>(null);

    const [projectLabels, setProjectLabels] =
        useState<Label[]>([]);

    const [labelError, setLabelError] =
        useState('');

    const [labelSubmitting, setLabelSubmitting] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [editing, setEditing] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [formError, setFormError] =
        useState('');

    const [comments, setComments] =
        useState<TaskComment[]>([]);

    const [commentText, setCommentText] =
        useState('');

    const [commentsLoading, setCommentsLoading] =
        useState(true);

    const [commentError, setCommentError] =
        useState('');

    const [commentSubmitting, setCommentSubmitting] =
        useState(false);

    const [editingCommentId, setEditingCommentId] =
        useState<string | null>(null);

    const [editingCommentText, setEditingCommentText] =
        useState('');

    const [commentUpdating, setCommentUpdating] =
        useState(false);

    const [commentDeletingId, setCommentDeletingId] =
        useState<string | null>(null);

    const [attachments, setAttachments] =
        useState<TaskAttachment[]>([]);

    const [attachmentsLoading, setAttachmentsLoading] =
        useState(true);

    const [attachmentError, setAttachmentError] =
        useState('');

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [attachmentUploading, setAttachmentUploading] =
        useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        status: 'TODO' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority,
        dueDate: '',
    });

    useEffect(() => {
        async function loadTask() {
            try {
                setLoading(true);
                setError('');

                const response =
                    await getTaskById(taskId);

                const loadedTask =
                    response.data.task;

                setTask(loadedTask);

                const labelsResponse =
                    await getProjectLabels(
                        loadedTask.projectId,
                    );

                setProjectLabels(
                    labelsResponse.data.labels,
                );

                setForm({
                    title: loadedTask.title,
                    description:
                        loadedTask.description || '',
                    status: loadedTask.status,
                    priority: loadedTask.priority,
                    dueDate: loadedTask.dueDate
                        ? loadedTask.dueDate.slice(
                            0,
                            10,
                        )
                        : '',
                });
            } catch {
                setError(
                    'Failed to load task.',
                );
            } finally {
                setLoading(false);
            }
        }

        loadTask();
    }, [taskId]);

    useEffect(() => {
        async function loadComments() {
            try {
                setCommentsLoading(true);
                setCommentError('');

                const response =
                    await getTaskComments(taskId);

                setComments(
                    response.data.comments,
                );
            } catch {
                setCommentError(
                    'Failed to load comments.',
                );
            } finally {
                setCommentsLoading(false);
            }
        }

        loadComments();
    }, [taskId]);

    useEffect(() => {
        async function loadAttachments() {
            try {
                setAttachmentsLoading(true);
                setAttachmentError('');

                const response =
                    await getTaskAttachments(taskId);

                setAttachments(
                    response.data.attachments,
                );
            } catch {
                setAttachmentError(
                    'Failed to load attachments.',
                );
            } finally {
                setAttachmentsLoading(false);
            }
        }

        loadAttachments();
    }, [taskId]);

    function handleEditStart() {
        if (!task) {
            return;
        }

        const developerCanEdit =
            isDeveloper &&
            task.assigneeId === currentUserId;

        if (
            !canEditFullTask &&
            !developerCanEdit
        ) {
            return;
        }

        setFormError('');

        setForm({
            title: task.title,
            description:
                task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate
                ? task.dueDate.slice(0, 10)
                : '',
        });

        setEditing(true);
    }

    function handleEditCancel() {
        if (saving) {
            return;
        }

        setFormError('');
        setEditing(false);
    }

    async function handleSave(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!task) {
            return;
        }

        if (isDeveloper) {
            if (task.assigneeId !== currentUserId) {
                setFormError(
                    'You can only update tasks assigned to you.',
                );

                return;
            }
        } else if (!canEditFullTask) {
            setFormError(
                'You do not have permission to update this task.',
            );

            return;
        }

        if (
            canEditFullTask &&
            !form.title.trim()
        ) {
            setFormError(
                'Task title is required.',
            );

            return;
        }

        try {
            setSaving(true);
            setFormError('');

            if (isDeveloper) {
                await updateTask(taskId, {
                    status: form.status,
                });
            } else {
                await updateTask(taskId, {
                    title: form.title.trim(),
                    description:
                        form.description.trim(),
                    status: form.status,
                    priority: form.priority,
                    dueDate:
                        form.dueDate || undefined,
                });
            }

            const response =
                await getTaskById(taskId);

            const updatedTask =
                response.data.task;

            setTask(updatedTask);

            setForm({
                title: updatedTask.title,
                description:
                    updatedTask.description || '',
                status: updatedTask.status,
                priority: updatedTask.priority,
                dueDate:
                    updatedTask.dueDate
                        ? updatedTask.dueDate.slice(
                            0,
                            10,
                        )
                        : '',
            });

            setEditing(false);
        } catch {
            setFormError(
                'Failed to update task.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!canEditFullTask) {
            return;
        }

        const confirmed =
            window.confirm(
                'Are you sure you want to delete this task?',
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setFormError('');

            await deleteTask(taskId);

            navigate('/tasks');
        } catch {
            setFormError(
                'Failed to delete task.',
            );
        } finally {
            setDeleting(false);
        }
    }

    async function handleAddComment(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!commentText.trim()) {
            return;
        }

        try {
            setCommentSubmitting(true);
            setCommentError('');

            const response =
                await createTaskComment(
                    taskId,
                    commentText.trim(),
                );

            setComments((current) => [
                ...current,
                response.data.comment,
            ]);

            setCommentText('');
        } catch {
            setCommentError(
                'Failed to add comment.',
            );
        } finally {
            setCommentSubmitting(false);
        }
    }

    async function handleUpdateComment(
        commentId: string,
    ) {
        if (!editingCommentText.trim()) {
            return;
        }

        try {
            setCommentUpdating(true);
            setCommentError('');

            const response =
                await updateTaskComment(
                    commentId,
                    editingCommentText.trim(),
                );

            setComments((current) =>
                current.map((comment) =>
                    comment.id === commentId
                        ? response.data.comment
                        : comment,
                ),
            );

            setEditingCommentId(null);
            setEditingCommentText('');
        } catch {
            setCommentError(
                'Failed to update comment.',
            );
        } finally {
            setCommentUpdating(false);
        }
    }

    async function handleDeleteComment(
        commentId: string,
    ) {
        try {
            setCommentDeletingId(commentId);
            setCommentError('');

            await deleteTaskComment(
                commentId,
            );

            setComments((current) =>
                current.filter(
                    (comment) =>
                        comment.id !== commentId,
                ),
            );
        } catch {
            setCommentError(
                'Failed to delete comment.',
            );
        } finally {
            setCommentDeletingId(null);
        }
    }

    async function handleUploadAttachment() {
        if (!selectedFile) {
            return;
        }

        try {
            setAttachmentUploading(true);
            setAttachmentError('');

            const response =
                await uploadTaskAttachment(
                    taskId,
                    selectedFile,
                );

            setAttachments((current) => [
                ...current,
                response.data.attachment,
            ]);

            setSelectedFile(null);
        } catch {
            setAttachmentError(
                'Failed to upload attachment.',
            );
        } finally {
            setAttachmentUploading(false);
        }
    }

    async function handleDeleteAttachment(
        attachmentId: string,
    ) {
        try {
            setAttachmentError('');

            await deleteTaskAttachment(
                attachmentId,
            );

            setAttachments((current) =>
                current.filter(
                    (attachment) =>
                        attachment.id !== attachmentId,
                ),
            );
        } catch {
            setAttachmentError(
                'Failed to delete attachment.',
            );
        }
    }

    async function handleAssignLabel(
        labelId: string,
    ) {
        try {
            setLabelSubmitting(true);
            setLabelError('');

            const response =
                await assignLabelToTask(
                    taskId,
                    labelId,
                );

            setTask((currentTask) =>
                currentTask
                    ? {
                        ...currentTask,
                        labels: [
                            ...currentTask.labels,
                            response.data.taskLabel,
                        ],
                    }
                    : currentTask,
            );
        } catch {
            setLabelError(
                'Failed to assign label.',
            );
        } finally {
            setLabelSubmitting(false);
        }
    }

    async function handleRemoveLabel(
        labelId: string,
    ) {
        try {
            setLabelSubmitting(true);
            setLabelError('');

            await removeLabelFromTask(
                taskId,
                labelId,
            );

            setTask((currentTask) =>
                currentTask
                    ? {
                        ...currentTask,
                        labels:
                            currentTask.labels.filter(
                                (taskLabel) =>
                                    taskLabel.labelId !==
                                    labelId,
                            ),
                    }
                    : currentTask,
            );
        } catch {
            setLabelError(
                'Failed to remove label.',
            );
        } finally {
            setLabelSubmitting(false);
        }
    }

    if (loading) {
        return (
            <section className="task-details-page">
                <div className="projects-state-card">
                    <FolderKanban size={28} />
                    <h3>Loading task...</h3>
                    <p>Please wait while task details are retrieved.</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="task-details-page">
                <div className="projects-state-card projects-error-state">
                    <h3>Unable to load task</h3>
                    <p className="form-error">{error}</p>
                    <Link
                        to="/tasks"
                        className="task-back-link"
                        style={{ marginTop: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back to Tasks
                    </Link>
                </div>
            </section>
        );
    }

    if (!task) {
        return (
            <section className="task-details-page">
                <div className="projects-state-card">
                    <FolderKanban size={28} />
                    <h3>Task not found</h3>
                    <p>The requested task does not exist or you lack permission to view it.</p>
                    <Link
                        to="/tasks"
                        className="task-back-link"
                        style={{ marginTop: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back to Tasks
                    </Link>
                </div>
            </section>
        );
    }

    const developerCanEdit =
        isDeveloper &&
        task.assigneeId === currentUserId;

    const canEdit =
        canEditFullTask || developerCanEdit;

    return (
        <section className="task-details-page">
            <div className="task-details-header">
                <div>
                    <Link
                        to="/tasks"
                        className="task-back-link"
                    >
                        <ArrowLeft size={16} /> Back to Tasks
                    </Link>

                    <h1>{task.title}</h1>

                    <p>
                        Project:{' '}
                        <Link to={`/projects/${task.projectId}`}>
                            {task.project.name}
                        </Link>
                    </p>
                </div>

                <div className="task-header-badges">
                    <span
                        className={`task-status-badge task-status-${task.status.toLowerCase()}`}
                    >
                        {task.status.replace('_', ' ')}
                    </span>

                    <span
                        className={`task-priority-badge task-priority-${task.priority.toLowerCase()}`}
                    >
                        {task.priority}
                    </span>
                </div>
            </div>

            {formError ? (
                <p className="form-error" style={{ marginBottom: '16px' }}>
                    {formError}
                </p>
            ) : null}

            {!editing && canEdit ? (
                <div className="task-actions-bar">
                    <button
                        type="button"
                        className="task-edit-button"
                        onClick={handleEditStart}
                    >
                        <Edit3 size={15} /> Edit Task
                    </button>

                    {canEditFullTask ? (
                        <button
                            type="button"
                            className="task-delete-button"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete Task'}
                        </button>
                    ) : null}
                </div>
            ) : null}

            {editing ? (
                <div className="task-form-card">
                    <div className="task-form-header">
                        <h2>Edit Task</h2>
                        <p>Update task details and status.</p>
                    </div>

                    <form
                        className="task-form"
                        onSubmit={handleSave}
                    >
                        {canEditFullTask ? (
                            <>
                                <div className="task-form-group">
                                    <label>
                                        Task Title
                                    </label>

                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                title:
                                                    event.target
                                                        .value,
                                            }))
                                        }
                                        disabled={saving}
                                    />
                                </div>

                                <div className="task-form-group">
                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        rows={4}
                                        value={form.description}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                description:
                                                    event.target
                                                        .value,
                                            }))
                                        }
                                        disabled={saving}
                                    />
                                </div>
                            </>
                        ) : null}

                        <div className="task-form-row">
                            <div className="task-form-group">
                                <label>
                                    Status
                                </label>

                                <select
                                    value={form.status}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            status:
                                                event.target
                                                    .value as TaskStatus,
                                        }))
                                    }
                                    disabled={saving}
                                >
                                    <option value="TODO">
                                        Todo
                                    </option>

                                    <option value="IN_PROGRESS">
                                        In Progress
                                    </option>

                                    <option value="IN_REVIEW">
                                        In Review
                                    </option>

                                    <option value="DONE">
                                        Done
                                    </option>
                                </select>
                            </div>

                            <div className="task-form-group">
                                <label>
                                    Priority
                                </label>

                                <select
                                    value={form.priority}
                                    disabled={
                                        isDeveloper || saving
                                    }
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            priority:
                                                event.target
                                                    .value as TaskPriority,
                                        }))
                                    }
                                >
                                    <option value="LOW">
                                        Low
                                    </option>

                                    <option value="MEDIUM">
                                        Medium
                                    </option>

                                    <option value="HIGH">
                                        High
                                    </option>

                                    <option value="CRITICAL">
                                        Critical
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="task-form-group">
                            <label>
                                Due Date
                            </label>

                            <input
                                type="date"
                                value={
                                    form.dueDate
                                }
                                disabled={
                                    isDeveloper || saving
                                }
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        dueDate:
                                            event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="task-form-actions">
                            <button
                                type="button"
                                className="project-cancel-button"
                                onClick={
                                    handleEditCancel
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="create-project-submit"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="task-details-card">
                    <div className="task-details-section">
                        <h2><FileText size={18} /> Description</h2>

                        <p className="task-description-text">
                            {task.description ||
                                'No description provided.'}
                        </p>
                    </div>

                    <div className="task-details-grid">
                        <div className="task-detail-item">
                            <span><AlertCircle size={14} /> Priority</span>
                            <strong>
                                {task.priority}
                            </strong>
                        </div>

                        <div className="task-detail-item">
                            <span><User size={14} /> Assignee</span>
                            <strong>
                                {task.assignee
                                    ? task.assignee.name
                                    : 'Unassigned'}
                            </strong>
                        </div>

                        <div className="task-detail-item">
                            <span><Calendar size={14} /> Due Date</span>
                            <strong>
                                {task.dueDate
                                    ? new Date(
                                        task.dueDate,
                                    ).toLocaleDateString()
                                    : 'Not set'}
                            </strong>
                        </div>

                        <div className="task-detail-item">
                            <span><User size={14} /> Created By</span>
                            <strong>
                                {task.createdBy.name}
                            </strong>
                        </div>

                        <div className="task-detail-item">
                            <span><FolderKanban size={14} /> Project Status</span>
                            <strong>
                                {task.project.status.replace('_', ' ')}
                            </strong>
                        </div>

                        <div className="task-detail-item">
                            <span><Clock size={14} /> Created At</span>
                            <strong>
                                {new Date(
                                    task.createdAt,
                                ).toLocaleDateString()}
                            </strong>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="task-details-section" style={{ borderTop: '1px solid var(--tf-border)', marginTop: '24px', paddingTop: '24px' }}>
                        <h2><Tag size={18} /> Labels</h2>

                        {task.labels &&
                            task.labels.length > 0 ? (
                            <div className="task-labels-list">
                                {task.labels.map(
                                    (taskLabel) => (
                                        <div
                                            key={
                                                taskLabel.labelId
                                            }
                                            className="task-label-chip"
                                        >
                                            <span
                                                className="task-label-color"
                                                style={{
                                                    backgroundColor:
                                                        taskLabel
                                                            .label
                                                            .color,
                                                }}
                                            />

                                            <span>
                                                {
                                                    taskLabel
                                                        .label
                                                        .name
                                                }
                                            </span>

                                            {canEditFullTask ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveLabel(
                                                            taskLabel.labelId,
                                                        )
                                                    }
                                                    disabled={
                                                        labelSubmitting
                                                    }
                                                    aria-label={`Remove ${taskLabel.label.name}`}
                                                >
                                                    ×
                                                </button>
                                            ) : null}
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                                No labels assigned to this task.
                            </p>
                        )}

                        {canEditFullTask ? (
                            <div className="task-label-add">
                                <select
                                    value=""
                                    onChange={(event) => {
                                        if (
                                            event
                                                .target
                                                .value
                                        ) {
                                            handleAssignLabel(
                                                event
                                                    .target
                                                    .value,
                                            );
                                        }
                                    }}
                                    disabled={
                                        labelSubmitting
                                    }
                                >
                                    <option value="">
                                        + Assign label...
                                    </option>

                                    {projectLabels
                                        .filter(
                                            (label) =>
                                                !task.labels.some(
                                                    (
                                                        taskLabel,
                                                    ) =>
                                                        taskLabel.labelId ===
                                                        label.id,
                                                ),
                                        )
                                        .map(
                                            (
                                                label,
                                            ) => (
                                                <option
                                                    key={
                                                        label.id
                                                    }
                                                    value={
                                                        label.id
                                                    }
                                                >
                                                    {
                                                        label.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                </select>
                            </div>
                        ) : null}

                        {labelError ? (
                            <p className="form-error">
                                {labelError}
                            </p>
                        ) : null}
                    </div>
                </div>
            )}

            <div className="task-details-card">
                <div className="task-details-section">
                    <h2><MessageSquare size={18} /> Comments</h2>

                    {commentError ? (
                        <p className="form-error">
                            {commentError}
                        </p>
                    ) : null}

                    {commentsLoading ? (
                        <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                            Loading comments...
                        </p>
                    ) : comments.length === 0 ? (
                        <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                            No comments yet. Start the conversation below.
                        </p>
                    ) : (
                        <div className="task-comments-list">
                            {comments.map(
                                (comment) => {
                                    const canManageComment =
                                        currentUserRole ===
                                        'ADMIN' ||
                                        currentUserId ===
                                        comment.authorId;

                                    return (
                                        <div
                                            key={
                                                comment.id
                                            }
                                            className="task-comment"
                                        >
                                            <div className="task-comment-header">
                                                <div className="task-comment-author">
                                                    <div className="task-comment-avatar">
                                                        {comment.author.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            {
                                                                comment
                                                                    .author
                                                                    .name
                                                            }
                                                        </strong>
                                                        <small>
                                                            <Clock size={11} />{' '}
                                                            {new Date(
                                                                comment.createdAt,
                                                            ).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </div>

                                                {canManageComment ? (
                                                    <div className="task-comment-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingCommentId(
                                                                    comment.id,
                                                                );

                                                                setEditingCommentText(
                                                                    comment.content,
                                                                );
                                                            }}
                                                            disabled={
                                                                commentUpdating
                                                            }
                                                        >
                                                            <Edit3 size={12} /> Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteComment(
                                                                    comment.id,
                                                                )
                                                            }
                                                            disabled={
                                                                commentUpdating ||
                                                                commentDeletingId ===
                                                                comment.id
                                                            }
                                                        >
                                                            <Trash2 size={12} />{' '}
                                                            {commentDeletingId ===
                                                                comment.id
                                                                ? 'Deleting...'
                                                                : 'Delete'}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {editingCommentId ===
                                                comment.id ? (
                                                <div className="task-comment-edit">
                                                    <textarea
                                                        rows={3}
                                                        value={
                                                            editingCommentText
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setEditingCommentText(
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                    />

                                                    <div className="task-comment-edit-actions">
                                                        <button
                                                            type="button"
                                                            className="create-project-submit"
                                                            onClick={() =>
                                                                handleUpdateComment(
                                                                    comment.id,
                                                                )
                                                            }
                                                            disabled={
                                                                commentUpdating ||
                                                                !editingCommentText.trim()
                                                            }
                                                        >
                                                            {commentUpdating
                                                                ? 'Saving...'
                                                                : 'Save'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="project-cancel-button"
                                                            onClick={() => {
                                                                setEditingCommentId(
                                                                    null,
                                                                );

                                                                setEditingCommentText(
                                                                    '',
                                                                );
                                                            }}
                                                            disabled={
                                                                commentUpdating
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="task-comment-content">
                                                    {
                                                        comment.content
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}

                    <form
                        className="task-comment-form"
                        onSubmit={
                            handleAddComment
                        }
                    >
                        <textarea
                            rows={3}
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(event) =>
                                setCommentText(
                                    event.target.value,
                                )
                            }
                        />

                        <div className="task-comment-form-actions">
                            <button
                                type="submit"
                                className="create-project-submit"
                                disabled={
                                    commentSubmitting ||
                                    !commentText.trim()
                                }
                            >
                                {commentSubmitting
                                    ? 'Posting...'
                                    : 'Post Comment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="task-details-card">
                <div className="task-details-section">
                    <h2><Paperclip size={18} /> Attachments</h2>

                    <div className="task-attachment-upload">
                        <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf,.docx,.txt"
                            onChange={(event) =>
                                setSelectedFile(
                                    event.target.files?.[0] ||
                                    null,
                                )
                            }
                            disabled={
                                attachmentUploading
                            }
                        />

                        <button
                            type="button"
                            className="create-project-submit"
                            onClick={
                                handleUploadAttachment
                            }
                            disabled={
                                attachmentUploading ||
                                !selectedFile
                            }
                        >
                            <Plus size={15} />
                            {attachmentUploading
                                ? 'Uploading...'
                                : 'Upload File'}
                        </button>
                    </div>

                    {attachmentError ? (
                        <p className="form-error">
                            {attachmentError}
                        </p>
                    ) : null}

                    {attachmentsLoading ? (
                        <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                            Loading attachments...
                        </p>
                    ) : attachments.length === 0 ? (
                        <p style={{ color: 'var(--tf-muted)', fontSize: '13px', margin: '12px 0 0' }}>
                            No attachments uploaded yet.
                        </p>
                    ) : (
                        <div className="task-attachments-list">
                            {attachments.map(
                                (attachment) => (
                                    <div
                                        key={
                                            attachment.id
                                        }
                                        className="task-attachment"
                                    >
                                        <div className="task-attachment-info">
                                            <Paperclip size={16} />
                                            <div>
                                                <a
                                                    href={
                                                        attachment.url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {
                                                        attachment.fileName
                                                    }
                                                </a>

                                                <span>
                                                    {(
                                                        attachment.size /
                                                        1024
                                                    ).toFixed(
                                                        1,
                                                    )}{' '}
                                                    KB
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="remove-project-member-button"
                                            onClick={() =>
                                                handleDeleteAttachment(
                                                    attachment.id,
                                                )
                                            }
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
