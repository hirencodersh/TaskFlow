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

  return (
    <section className="tasks-page">
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>

          <p>
            Manage your TaskFlow tasks.
          </p>
        </div>

        <div className="tasks-header-actions">
          <span>
            {pagination.total} tasks
          </span>

          {canCreateTask ? (
            <button
              type="button"
              className="create-task-button"
              onClick={handleOpenCreateForm}
            >
              Create Task
            </button>
          ) : null}
        </div>
      </div>

      {showCreateForm ? (
        <div className="create-task-card">
          <div className="create-task-header">
            <h2>
              Create Task
            </h2>

            <button
              type="button"
              onClick={
                handleCloseCreateForm
              }
              disabled={formLoading}
            >
              ×
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
              <label>
                Project
              </label>

              <select
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
              <label>
                Title
              </label>

              <input
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
              <label>
                Description
              </label>

              <textarea
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
                <label>
                  Assignee
                </label>

                <select
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
            </div>

            <div className="task-form-actions">
              <button
                type="button"
                onClick={
                  handleCloseCreateForm
                }
                disabled={formLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
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
        <p>Loading tasks...</p>
      ) : error ? (
        <p className="form-error">
          {error}
        </p>
      ) : tasks.length === 0 ? (
        <div className="tasks-empty">
          <p>
            No tasks found.
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
                  <div>
                    <h2>
                      {task.title}
                    </h2>

                    <p>
                      {task.description ||
                        'No description.'}
                    </p>
                  </div>

                  <span
                    className={`task-status task-status-${task.status.toLowerCase()}`}
                  >
                    {task.status.replace(
                      '_',
                      ' ',
                    )}
                  </span>
                </div>

                <div className="task-card-meta">
                  <span>
                    Project:{' '}
                    <strong>
                      {task.project.name}
                    </strong>
                  </span>

                  <span>
                    Priority:{' '}
                    <strong>
                      {task.priority}
                    </strong>
                  </span>

                  <span>
                    Assignee:{' '}
                    <strong>
                      {task.assignee
                        ? task.assignee.name
                        : 'Unassigned'}
                    </strong>
                  </span>

                  <span>
                    Due:{' '}
                    <strong>
                      {task.dueDate
                        ? new Date(
                          task.dueDate,
                        ).toLocaleDateString()
                        : 'Not set'}
                    </strong>
                  </span>
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