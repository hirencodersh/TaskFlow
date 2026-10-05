import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    deleteTask,
    getTaskById,
    updateTask,
    type Task,
    type TaskPriority,
    type TaskStatus,
} from './tasks.api';

import { useAuthStore } from '../../store/auth.store';

import {
    createTaskComment,
    getTaskComments,
    updateTaskComment,
    deleteTaskComment,
    type TaskComment,
} from './comments.api';

type TaskDetailsPageProps = {
    taskId: string;
};

export default function TaskDetailsPage({
    taskId,
}: TaskDetailsPageProps) {
    const navigate = useNavigate();

    const currentUser = useAuthStore(
        (state) => state.user,
    );

    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;

    const [task, setTask] =
        useState<Task | null>(null);

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

    function handleEditStart() {
        if (!task) {
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

        if (!form.title.trim()) {
            setFormError(
                'Task title is required.',
            );

            return;
        }

        try {
            setSaving(true);
            setFormError('');

            await updateTask(taskId, {
                title: form.title.trim(),
                description:
                    form.description.trim(),
                status: form.status,
                priority: form.priority,
                dueDate:
                    form.dueDate || undefined,
            });

            const response =
                await getTaskById(taskId);

            setTask(response.data.task);

            setForm({
                title: response.data.task.title,
                description:
                    response.data.task.description ||
                    '',
                status: response.data.task.status,
                priority:
                    response.data.task.priority,
                dueDate:
                    response.data.task.dueDate
                        ? response.data.task.dueDate.slice(
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
        const confirmed = window.confirm(
            'Are you sure you want to delete this comment?',
        );

        if (!confirmed) {
            return;
        }

        try {
            setCommentDeletingId(commentId);
            setCommentError('');

            await deleteTaskComment(commentId);

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

    if (loading) {
        return (
            <section>
                <p>Loading task...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section>
                <p className="form-error">
                    {error}
                </p>
            </section>
        );
    }

    if (!task) {
        return (
            <section>
                <p>Task not found.</p>
            </section>
        );
    }

    return (
        <section className="task-details-page">
            <div className="task-details-header">
                <div>
                    <h1>{task.title}</h1>

                    <p>
                        Project:{' '}
                        <strong>
                            {task.project.name}
                        </strong>
                    </p>
                </div>

                <div className="task-details-header-actions">
                    <span
                        className={`task-status task-status-${task.status.toLowerCase()}`}
                    >
                        {task.status.replace(
                            '_',
                            ' ',
                        )}
                    </span>

                    {!editing ? (
                        <>
                            <button
                                type="button"
                                onClick={
                                    handleEditStart
                                }
                                disabled={deleting}
                            >
                                Edit Task
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting
                                    ? 'Deleting...'
                                    : 'Delete Task'}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {editing ? (
                <div className="task-details-card">
                    <h2>Edit Task</h2>

                    {formError ? (
                        <p className="form-error">
                            {formError}
                        </p>
                    ) : null}

                    <form
                        className="task-edit-form"
                        onSubmit={handleSave}
                    >
                        <div className="task-form-group">
                            <label>
                                Title
                            </label>

                            <input
                                type="text"
                                value={form.title}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        title:
                                            event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="task-form-group">
                            <label>
                                Description
                            </label>

                            <textarea
                                rows={5}
                                value={
                                    form.description
                                }
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description:
                                            event.target.value,
                                    }))
                                }
                            />
                        </div>

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
                                onClick={
                                    handleEditCancel
                                }
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
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
                        <h2>Description</h2>

                        <p>
                            {task.description ||
                                'No description.'}
                        </p>
                    </div>

                    <div className="task-details-grid">
                        <div>
                            <span>Priority</span>

                            <strong>
                                {task.priority}
                            </strong>
                        </div>

                        <div>
                            <span>Assignee</span>

                            <strong>
                                {task.assignee
                                    ? task.assignee.name
                                    : 'Unassigned'}
                            </strong>
                        </div>

                        <div>
                            <span>Due Date</span>

                            <strong>
                                {task.dueDate
                                    ? new Date(
                                        task.dueDate,
                                    ).toLocaleDateString()
                                    : 'Not set'}
                            </strong>
                        </div>

                        <div>
                            <span>Created By</span>

                            <strong>
                                {task.createdBy.name}
                            </strong>
                        </div>

                        <div>
                            <span>Project Status</span>

                            <strong>
                                {task.project.status}
                            </strong>
                        </div>

                        <div>
                            <span>Created At</span>

                            <strong>
                                {new Date(
                                    task.createdAt,
                                ).toLocaleDateString()}
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            <div className="task-details-card">
                <div className="task-details-section">
                    <h2>Comments</h2>

                    {commentError ? (
                        <p className="form-error">
                            {commentError}
                        </p>
                    ) : null}

                    {commentsLoading ? (
                        <p>
                            Loading comments...
                        </p>
                    ) : comments.length === 0 ? (
                        <p>
                            No comments yet.
                        </p>
                    ) : (
                        <div className="task-comments-list">
                            {comments.map(
                                (comment) => {
                                    const canManageComment =
                                        currentUserRole === 'ADMIN' ||
                                        currentUserId === comment.authorId;

                                    return (
                                        <div
                                            key={comment.id}
                                            className="task-comment"
                                        >
                                            <div className="task-comment-header">
                                                <div>
                                                    <strong>
                                                        {comment.author.name}
                                                    </strong>

                                                    <span>
                                                        {' '}
                                                        {new Date(
                                                            comment.createdAt,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {canManageComment ? (
                                                    <div>
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
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteComment(comment.id)
                                                            }
                                                            disabled={
                                                                commentUpdating ||
                                                                commentDeletingId === comment.id
                                                            }
                                                        >
                                                            {commentDeletingId === comment.id
                                                                ? 'Deleting...'
                                                                : 'Delete'}
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="task-comment-edit">
                                                    <textarea
                                                        rows={3}
                                                        value={
                                                            editingCommentText
                                                        }
                                                        onChange={(event) =>
                                                            setEditingCommentText(
                                                                event.target.value,
                                                            )
                                                        }
                                                    />

                                                    <div>
                                                        <button
                                                            type="button"
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
                                                <p>
                                                    {comment.content}
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
                            rows={4}
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(event) =>
                                setCommentText(
                                    event.target.value,
                                )
                            }
                        />

                        <button
                            type="submit"
                            disabled={
                                commentSubmitting ||
                                !commentText.trim()
                            }
                        >
                            {commentSubmitting
                                ? 'Adding...'
                                : 'Add Comment'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}