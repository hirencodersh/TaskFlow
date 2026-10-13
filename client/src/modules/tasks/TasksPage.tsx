import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ListTodo,
  Plus,
  Search,
  UserRound,
  X,
  Kanban,
  LayoutList,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  createTask,
  getTasks,
  updateTask,
  type Task,
  type TaskPagination,
  type TaskPriority,
  type TaskStatus,
} from './tasks.api';

import { useAuthStore } from '../../store/auth.store';
import { formatDate } from '../../lib/date';

import {
  getProjects,
  getProjectMembers,
  type Project,
  type ProjectMember,
} from '../projects/projects.api';

export default function TasksPage() {
  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [viewMode, setViewMode] =
    useState<'list' | 'kanban'>('list');

  const [pagination, setPagination] =
    useState<TaskPagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const currentUser = useAuthStore(
    (state) => state.user,
  );

  const canCreateTask =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'PROJECT_MANAGER';

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<TaskStatus | ''>('');

  const [priority, setPriority] =
    useState<TaskPriority | ''>('');

  const [myWork, setMyWork] =
    useState(
      currentUser?.role === 'DESIGNER' ||
      currentUser?.role === 'DEVELOPER' ||
      currentUser?.role === 'QA'
    );

  const [sortBy] =
    useState<
      | 'createdAt'
      | 'dueDate'
      | 'priority'
      | 'title'
    >('createdAt');

  const [sortOrder] =
    useState<'asc' | 'desc'>('desc');

  const [page, setPage] =
    useState(1);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [projectMembers, setProjectMembers] =
    useState<ProjectMember[]>([]);

  const [formLoading, setFormLoading] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [form, setForm] = useState({
    projectId: '',
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assigneeIds: [] as string[],
    dueDate: '',
    isPipeline: false,
    designAssigneeId: '',
    devAssigneeId: '',
    qaAssigneeId: '',
  });

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setError('');

        const response =
          await getTasks({
            search: search.trim() || undefined,
            status: status || undefined,
            priority:
              priority || undefined,
            myWork: myWork || undefined,
            page,
            limit: viewMode === 'kanban' ? 50 : 20,
            sortBy,
            sortOrder,
          });

        setTasks(
          response.data.tasks,
        );

        setPagination(
          response.data.pagination,
        );
      } catch {
        setError(
          'Failed to load tasks.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [search, status, priority, myWork, page, sortBy, sortOrder, viewMode]);

  useEffect(() => {
    async function loadProjects() {
      if (!currentUser) return;
      try {
        const response = await getProjects();
        setProjects(response.data.projects);
      } catch {
        console.error('Failed to load projects');
      }
    }

    loadProjects();
  }, [currentUser]);

  function handleOpenCreateForm() {
    setFormError('');
    setShowCreateForm(true);
  }

  async function handleProjectChange(
    projectId: string,
  ) {
    setForm((current) => ({
      ...current,
      projectId,
      assigneeIds: [],
      designAssigneeId: '',
      devAssigneeId: '',
      qaAssigneeId: '',
    }));

    setProjectMembers([]);
    setFormError('');

    if (!projectId) {
      return;
    }

    try {
      const response =
        await getProjectMembers(
          projectId,
        );

      setProjectMembers(
        response.data.members,
      );
    } catch {
      setFormError(
        'Failed to load project members.',
      );
    }
  }

  function handleCloseCreateForm() {
    if (formLoading) {
      return;
    }

    setShowCreateForm(false);
    setFormError('');
    setProjectMembers([]);

    setForm({
      projectId: '',
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeIds: [],
      dueDate: '',
      isPipeline: false,
      designAssigneeId: '',
      devAssigneeId: '',
      qaAssigneeId: '',
    });
  }

  async function handleCreateTask(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.projectId ||
      !form.title.trim()
    ) {
      setFormError(
        'Project and title are required.',
      );

      return;
    }

    if (form.isPipeline) {
      if (!form.designAssigneeId || !form.devAssigneeId || !form.qaAssigneeId) {
        setFormError('Pipeline creation requires assigning a Designer, Developer, and QA.');
        return;
      }
    }

    try {
      setFormLoading(true);
      setFormError('');

      await createTask({
        projectId: form.projectId,
        title: form.title.trim(),
        description:
          form.description.trim() ||
          undefined,
        status: form.status,
        priority: form.priority,
        assigneeIds: !form.isPipeline && form.assigneeIds.length > 0 ? form.assigneeIds : undefined,
        dueDate:
          form.dueDate || undefined,
        isPipeline: form.isPipeline || undefined,
        designAssigneeId: form.isPipeline ? form.designAssigneeId : undefined,
        devAssigneeId: form.isPipeline ? form.devAssigneeId : undefined,
        qaAssigneeId: form.isPipeline ? form.qaAssigneeId : undefined,
      });

      handleCloseCreateForm();
      setPage(1);

      const response =
        await getTasks({
          search: search.trim() || undefined,
          status: status || undefined,
          priority:
            priority || undefined,
          page: 1,
          limit: viewMode === 'kanban' ? 50 : 20,
          sortBy,
          sortOrder,
        });

      setTasks(
        response.data.tasks,
      );

      setPagination(
        response.data.pagination,
      );
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create task.';
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const previousStatus = task.status;

    // Optimistic update
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error: unknown) {
      // Revert on failure
      setTasks((current) =>
        current.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)),
      );
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update task status (blocked by dependencies or permissions).';
      alert(message);
    }
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('text/plain', taskId);
  }

  async function handleDrop(e: React.DragEvent, targetStatus: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    await handleStatusChange(taskId, targetStatus);
  }

  function formatStatus(
    taskStatus: TaskStatus,
  ) {
    return taskStatus
      .toLowerCase()
      .replace('_', ' ');
  }

  const kanbanColumns: { status: TaskStatus; label: string }[] = [
    { status: 'TODO', label: 'To Do' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'IN_REVIEW', label: 'In Review' },
    { status: 'DONE', label: 'Done' },
  ];

  return (
    <section className="tasks-page">
      <div className="tasks-header">
        <div>
          <span className="tasks-eyebrow">
            Workspace
          </span>

          <h1>Tasks</h1>

          <p>
            Track, prioritize, and manage your
            team's work.
          </p>
        </div>

        <div className="tasks-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="tasks-view-toggle">
            <button
              type="button"
              className={`tasks-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <LayoutList size={16} /> List
            </button>
            <button
              type="button"
              className={`tasks-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <Kanban size={16} /> Kanban
            </button>
          </div>

          <span className="tasks-count">
            <ListTodo size={15} />
            {pagination.total} tasks
          </span>

          {canCreateTask ? (
            <button
              type="button"
              className="create-task-button"
              onClick={handleOpenCreateForm}
            >
              <Plus size={17} />
              Create Task
            </button>
          ) : null}
        </div>
      </div>

      {showCreateForm ? (
        <div className="create-task-card">
          <div className="create-task-header">
            <div>
              <span className="task-form-eyebrow">
                New task
              </span>

              <h2>Create Task</h2>

              <p>
                Add a task and assign it to project members.
              </p>
            </div>

            <button
              type="button"
              className="create-task-close"
              onClick={
                handleCloseCreateForm
              }
              disabled={formLoading}
              aria-label="Close create task form"
            >
              <X size={19} />
            </button>
          </div>

          {formError ? (
            <p className="form-error">
              {formError}
            </p>
          ) : null}

          <form
            className="create-task-form"
            onSubmit={handleCreateTask}
          >
            <div className="task-form-group">
              <label htmlFor="task-project">
                Project
              </label>

              <select
                id="task-project"
                value={
                  form.projectId
                }
                onChange={(event) =>
                  handleProjectChange(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="task-form-group">
              <label htmlFor="task-title">
                Title
              </label>

              <input
                id="task-title"
                type="text"
                placeholder="Enter task title"
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

            <div className="task-form-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.isPipeline}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((current) => ({ ...current, isPipeline: checked }));
                  }}
                />
                Create Linked Design → Development → QA Pipeline
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                Automatically generates 3 sequential subtasks with pre-linked dependencies and role assignments.
              </p>
            </div>

            <div className="task-form-group">
              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                rows={4}
                placeholder="Enter task description"
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

            {form.isPipeline ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>Pipeline Role Assignments</h4>
                <div className="task-form-group">
                  <label htmlFor="design-assignee">Designer Assignee</label>
                  <select
                    id="design-assignee"
                    value={form.designAssigneeId}
                    onChange={(e) => setForm((curr) => ({ ...curr, designAssigneeId: e.target.value }))}
                  >
                    <option value="">Select Designer</option>
                    {projectMembers
                      .filter((m) => m.user.role === 'DESIGNER')
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.user.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="task-form-group">
                  <label htmlFor="dev-assignee">Developer Assignee</label>
                  <select
                    id="dev-assignee"
                    value={form.devAssigneeId}
                    onChange={(e) => setForm((curr) => ({ ...curr, devAssigneeId: e.target.value }))}
                  >
                    <option value="">Select Developer</option>
                    {projectMembers
                      .filter((m) => m.user.role === 'DEVELOPER')
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.user.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="task-form-group">
                  <label htmlFor="qa-assignee">QA Assignee</label>
                  <select
                    id="qa-assignee"
                    value={form.qaAssigneeId}
                    onChange={(e) => setForm((curr) => ({ ...curr, qaAssigneeId: e.target.value }))}
                  >
                    <option value="">Select QA</option>
                    {projectMembers
                      .filter((m) => m.user.role === 'QA')
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.user.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="task-form-row">
                  <div className="task-form-group">
                    <label htmlFor="task-status">
                      Status
                    </label>

                    <select
                      id="task-status"
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event
                            .target
                            .value as TaskStatus,
                        }))
                      }
                    >
                      <option value="TODO">
                        To Do
                      </option>
                      <option
                        value="IN_PROGRESS"
                      >
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
                    <label htmlFor="task-priority">
                      Priority
                    </label>

                    <select
                      id="task-priority"
                      value={
                        form.priority
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          priority: event
                            .target
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
                      <option
                        value="CRITICAL"
                      >
                        Critical
                      </option>
                    </select>
                  </div>
                </div>

                <div className="task-form-row">
                  <div className="task-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>
                      Assignees (Select multiple)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '140px', overflowY: 'auto', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      {projectMembers.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Select a project first</span>
                      ) : (
                        projectMembers.map((member) => (
                          <label key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={form.assigneeIds.includes(member.userId)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setForm((current) => ({
                                  ...current,
                                  assigneeIds: checked
                                    ? [...current.assigneeIds, member.userId]
                                    : current.assigneeIds.filter((id) => id !== member.userId),
                                }));
                              }}
                            />
                            {member.user.name} ({member.user.role})
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="task-form-row">
              <div className="task-form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="task-due-date">
                  Due Date
                </label>

                <input
                  id="task-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate:
                        event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="task-form-actions">
              <button
                type="button"
                className="task-form-cancel"
                onClick={
                  handleCloseCreateForm
                }
                disabled={formLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="task-form-submit"
                disabled={formLoading}
              >
                {formLoading
                  ? 'Creating...'
                  : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="tasks-filters">
        <div className="tasks-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className={`tasks-view-btn ${myWork ? 'active' : ''}`}
            style={{
              background: myWork ? '#0f172a' : '#fff',
              color: myWork ? '#fff' : '#0f172a',
              borderColor: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => {
              setMyWork((prev) => !prev);
              setPage(1);
            }}
          >
            <UserRound size={15} /> My Work
          </button>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TaskStatus | '');
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as TaskPriority | '');
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="tasks-state-card">
          <ListTodo size={32} />
          <h3>Loading tasks...</h3>
          <p>Fetching your latest workspace tasks.</p>
        </div>
      ) : error ? (
        <div className="tasks-state-card tasks-error-state">
          <X size={28} />
          <h3>Unable to load tasks</h3>
          <p>{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="tasks-state-card">
          <CheckCircle2 size={30} />
          <h3>No tasks found</h3>
          <p>Try changing your filters or create a new task.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="kanban-board">
          {kanbanColumns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="kanban-column"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title">
                    <span className={`task-status task-status-${col.status.toLowerCase()}`}></span>
                    {col.label}
                  </span>
                  <span className="kanban-column-count">{columnTasks.length}</span>
                </div>

                <div className="kanban-cards-list">
                  {columnTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#94a3b8' }}>
                      Drag tasks here
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        <Link to={`/tasks/${task.id}`} className="kanban-card-title">
                          {task.title}
                        </Link>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                          {task.project.name}
                        </div>
                        <div className="kanban-card-footer">
                          <span className={`task-priority-text priority-text-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                          <span>{task.assignees?.length ? `${task.assignees.length} assignees` : 'Unassigned'}</span>
                        </div>

                        <div className="kanban-card-actions">
                          {col.status !== 'TODO' && (
                            <button
                              type="button"
                              className="kanban-move-btn"
                              onClick={() => {
                                const prevStatus: Record<TaskStatus, TaskStatus> = {
                                  TODO: 'TODO',
                                  IN_PROGRESS: 'TODO',
                                  IN_REVIEW: 'IN_PROGRESS',
                                  DONE: 'IN_REVIEW',
                                };
                                handleStatusChange(task.id, prevStatus[col.status]);
                              }}
                            >
                              ← Move
                            </button>
                          )}
                          {col.status !== 'DONE' && (
                            <button
                              type="button"
                              className="kanban-move-btn"
                              onClick={() => {
                                const nextStatus: Record<TaskStatus, TaskStatus> = {
                                  TODO: 'IN_PROGRESS',
                                  IN_PROGRESS: 'IN_REVIEW',
                                  IN_REVIEW: 'DONE',
                                  DONE: 'DONE',
                                };
                                handleStatusChange(task.id, nextStatus[col.status]);
                              }}
                            >
                              Move →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="tasks-list">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="task-card"
              >
                <div className="task-card-main">
                  <div className="task-card-title-area">
                    <div className="task-card-icon">
                      <ListTodo size={18} />
                    </div>

                    <div className="task-card-content">
                      <h2>
                        {task.title}
                      </h2>

                      <p>
                        {task.description ||
                          'No description.'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`task-status task-status-${task.status.toLowerCase()}`}
                  >
                    {formatStatus(task.status)}
                  </span>
                </div>

                <div className="task-card-meta">
                  <span>
                    <FolderIcon />

                    <strong>
                      {task.project.name}
                    </strong>
                  </span>

                  <span>
                    <CircleDot size={14} />

                    <strong
                      className={`task-priority-text priority-text-${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </strong>
                  </span>

                  <span>
                    <UserRound size={14} />

                    <strong>
                      {task.assignees?.length > 0
                        ? task.assignees.map((a) => a.user.name).join(', ')
                        : task.assignee
                          ? task.assignee.name
                          : 'Unassigned'}
                    </strong>
                  </span>

                  <span>
                    <CalendarDays size={14} />

                    <strong>
                      {formatDate(task.dueDate)}
                    </strong>
                  </span>

                  <ArrowRight
                    className="task-card-arrow"
                    size={17}
                  />
                </div>
              </Link>
            ))}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="tasks-pagination">
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1,
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {pagination.page}{' '}
                of{' '}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page ===
                  pagination.totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1,
                  )
                }
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function FolderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
