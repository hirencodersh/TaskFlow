import {
  CalendarDays,
  FolderKanban,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  createProject,
  getProjects,
  type Project,
  type ProjectStatus,
} from './projects.api';

import { useAuthStore } from '../../store/auth.store';

type ProjectFormData = {
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = useAuthStore(
    (state) => state.user,
  );

  const canCreateProject =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'PROJECT_MANAGER';

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [formData, setFormData] =
    useState<ProjectFormData>({
      name: '',
      description: '',
      status: 'PLANNING',
      dueDate: '',
    });

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError('');

        const response = await getProjects();

        setProjects(response.data.projects);
      } catch {
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const handleInputChange = (
    field: keyof ProjectFormData,
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setFormError('');

    if (!formData.name.trim()) {
      setFormError(
        'Project name is required.',
      );
      return;
    }

    try {
      setIsCreating(true);

      const response = await createProject({
        name: formData.name.trim(),
        description:
          formData.description.trim() || undefined,
        status: formData.status,
        dueDate:
          formData.dueDate || undefined,
      });

      setProjects((current) => [
        response.data.project,
        ...current,
      ]);

      setFormData({
        name: '',
        description: '',
        status: 'PLANNING',
        dueDate: '',
      });

      setShowCreateForm(false);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create project.';

      setFormError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="projects-page">
      <div className="projects-header">
        <div>
          <span className="projects-eyebrow">
            Workspace
          </span>

          <h1>Projects</h1>

          <p>
            Organize your work and keep every project
            moving forward.
          </p>
        </div>

        {canCreateProject && (
          <button
            type="button"
            className="create-project-button"
            onClick={() => {
              setShowCreateForm(
                (current) => !current,
              );

              setFormError('');
            }}
          >
            {showCreateForm ? (
              <>
                <X size={17} />
                Close
              </>
            ) : (
              <>
                <Plus size={17} />
                Create Project
              </>
            )}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="project-form-card">
          <div className="project-form-header">
            <div>
              <span className="project-form-eyebrow">
                New workspace project
              </span>

              <h2>Create Project</h2>

              <p>
                Add the basic details for your new
                project.
              </p>
            </div>
          </div>

          <form
            className="project-form"
            onSubmit={handleCreateProject}
          >
            <div className="project-form-group">
              <label htmlFor="project-name">
                Project Name
              </label>

              <input
                id="project-name"
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleInputChange(
                    'name',
                    event.target.value,
                  )
                }
                placeholder="e.g. Website Redesign"
                disabled={isCreating}
              />
            </div>

            <div className="project-form-group">
              <label htmlFor="project-description">
                Description
              </label>

              <textarea
                id="project-description"
                value={formData.description}
                onChange={(event) =>
                  handleInputChange(
                    'description',
                    event.target.value,
                  )
                }
                placeholder="Briefly describe this project..."
                rows={4}
                disabled={isCreating}
              />
            </div>

            <div className="project-form-row">
              <div className="project-form-group">
                <label htmlFor="project-status">
                  Status
                </label>

                <select
                  id="project-status"
                  value={formData.status}
                  onChange={(event) =>
                    handleInputChange(
                      'status',
                      event.target.value,
                    )
                  }
                  disabled={isCreating}
                >
                  <option value="PLANNING">
                    Planning
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>
                </select>
              </div>

              <div className="project-form-group">
                <label htmlFor="project-due-date">
                  Due Date
                </label>

                <input
                  id="project-due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    handleInputChange(
                      'dueDate',
                      event.target.value,
                    )
                  }
                  disabled={isCreating}
                />
              </div>
            </div>

            {formError && (
              <p className="form-error">
                {formError}
              </p>
            )}

            <div className="project-form-actions">
              <button
                type="button"
                className="project-cancel-button"
                onClick={() =>
                  setShowCreateForm(false)
                }
                disabled={isCreating}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-project-submit"
                disabled={isCreating}
              >
                {isCreating
                  ? 'Creating...'
                  : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="projects-state-card">
          <FolderKanban size={28} />

          <h3>Loading projects...</h3>

          <p>
            Please wait while your workspace loads.
          </p>
        </div>
      )}

      {error && (
        <div className="projects-state-card projects-error-state">
          <h3>Unable to load projects</h3>

          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        projects.length === 0 && (
          <div className="projects-state-card">
            <FolderKanban size={32} />

            <h3>No projects yet</h3>

            <p>
              Create your first project to start
              organizing your work.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        projects.length > 0 && (
          <div className="projects-grid">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card"
              >
                <div className="project-card-top">
                  <div className="project-card-title">
                    <span className="project-card-icon">
                      <FolderKanban size={18} />
                    </span>

                    <h2>{project.name}</h2>
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

                <p className="project-description">
                  {project.description ||
                    'No description available.'}
                </p>

                <div className="project-card-footer">
                  <span>
                    <CalendarDays size={14} />

                    Created{' '}
                    {new Date(
                      project.createdAt,
                    ).toLocaleDateString()}
                  </span>

                  <span className="project-card-arrow">
                    <ArrowRight size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
    </section>
  );
}