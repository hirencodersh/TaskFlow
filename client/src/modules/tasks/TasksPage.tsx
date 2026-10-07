import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ListTodo,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
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
  type Task,
  type TaskPagination,
  type TaskPriority,
  type TaskStatus,
} from './tasks.api';

import { useAuthStore } from '../../store/auth.store';

import {
  getProjects,
  getProjectMembers,
  type Project,
  type ProjectMember,
} from '../projects/projects.api';

export default function TasksPage() {
  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [pagination, setPagination] =
    useState<TaskPagination>({
      page: 1,
      limit: 10,
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

  const [sortBy, setSortBy] =
    useState<
      | 'createdAt'
      | 'dueDate'
      | 'priority'
      | 'title'
    >('createdAt');

  const [sortOrder, setSortOrder] =
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
    assigneeId: '',
    dueDate: '',
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
            page,
            limit: 10,
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
  }, [
    search,
    status,
    priority,
    sortBy,
    sortOrder,
    page,
  ]);

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(
    value: TaskStatus | '',
  ) {
    setStatus(value);
    setPage(1);
  }

  function handlePriorityChange(
    value: TaskPriority | '',
  ) {
    setPriority(value);
    setPage(1);
  }

  async function handleOpenCreateForm() {
    try {
      setFormError('');

      const projectsResponse =
        await getProjects();

      setProjects(
        projectsResponse.data.projects,
      );

      setProjectMembers([]);

      setShowCreateForm(true);
    } catch {
      setFormError(
        'Failed to load projects.',
      );

      setShowCreateForm(true);
    }
  }

  async function handleProjectChange(
    projectId: string,
  ) {
    setForm((current) => ({
      ...current,
      projectId,
      assigneeId: '',
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
      assigneeId: '',
      dueDate: '',
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
        assigneeId:
          form.assigneeId || undefined,
        dueDate:
          form.dueDate || undefined,
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
          limit: 10,
        });

      setTasks(
        response.data.tasks,
      );

      setPagination(
        response.data.pagination,
      );
    } catch {
      setFormError(
        'Failed to create task.',
      );
    } finally {
      setFormLoading(false);
    }
  }

  function handleSortByChange(
    value:
      | 'createdAt'
      | 'dueDate'
      | 'priority'
      | 'title',
  ) {
    setSortBy(value);
    setPage(1);
  }

  function handleSortOrderChange(
    value: 'asc' | 'desc',
  ) {
    setSortOrder(value);
    setPage(1);
  }

  function formatStatus(
    taskStatus: TaskStatus,
  ) {
    return taskStatus
      .toLowerCase()
      .replace('_', ' ');
  }

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

        <div className="tasks-header-actions">
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
                Add a task and assign it to a
                project member.
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

            <div className="task-form-group">
              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                rows={5}
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

            <div className="task-form-row">
              <div className="task-form-group">
                <label htmlFor="task-assignee">
                  Assignee
                </label>

                <select
                  id="task-assignee"
                  value={
                    form.assigneeId
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      assigneeId:
                        event.target.value,
                    }))
                  }
                  disabled={
                    !form.projectId ||
                    projectMembers.length === 0
                  }
                >
                  <option value="">
                    {form.projectId
                      ? projectMembers.length === 0
                        ? 'No project members'
                        : 'Unassigned'
                      : 'Select project first'}
                  </option>

                  {projectMembers.map(
                    (member) => (
                      <option
                        key={member.userId}
                        value={
                          member.userId
                        }
                      >
                        {member.user.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="task-form-group">
                <label htmlFor="task-due-date">
                  Due Date
                </label>

                <input
                  id="task-due-date"
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
        <div className="tasks-filter-title">
          <SlidersHorizontal size={17} />
          <span>Filters</span>
        </div>

        <div className="tasks-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) =>
              handleSearchChange(
                event.target.value,
              )
            }
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            handleStatusChange(
              event.target
                .value as TaskStatus | '',
            )
          }
        >
          <option value="">
            All Statuses
          </option>

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

        <select
          value={priority}
          onChange={(event) =>
            handlePriorityChange(
              event.target
                .value as TaskPriority | '',
            )
          }
        >
          <option value="">
            All Priorities
          </option>

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

        <select
          value={sortBy}
          onChange={(event) =>
            handleSortByChange(
              event.target.value as
                | 'createdAt'
                | 'dueDate'
                | 'priority'
                | 'title',
            )
          }
        >
          <option value="createdAt">
            Created Date
          </option>

          <option value="dueDate">
            Due Date
          </option>

          <option value="priority">
            Priority
          </option>

          <option value="title">
            Title
          </option>
        </select>

        <select
          value={sortOrder}
          onChange={(event) =>
            handleSortOrderChange(
              event.target.value as
                | 'asc'
                | 'desc',
            )
          }
        >
          <option value="desc">
            Descending
          </option>

          <option value="asc">
            Ascending
          </option>
        </select>
      </div>

      {loading ? (
        <div className="tasks-state-card">
          <ListTodo size={28} />

          <h3>Loading tasks...</h3>

          <p>
            Fetching your latest workspace tasks.
          </p>
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

          <p>
            Try changing your filters or create a
            new task.
          </p>
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
                      {task.assignee
                        ? task.assignee.name
                        : 'Unassigned'}
                    </strong>
                  </span>

                  <span>
                    <CalendarDays size={14} />

                    <strong>
                      {task.dueDate
                        ? new Date(
                            task.dueDate,
                          ).toLocaleDateString()
                        : 'Not set'}
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