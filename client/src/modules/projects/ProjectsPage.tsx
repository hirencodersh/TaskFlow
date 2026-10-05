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

type ProjectFormData = {
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
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
          <h1>Projects</h1>

          <p>
            Manage your TaskFlow projects.
          </p>
        </div>

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
          {showCreateForm
            ? 'Close'
            : '+ Create Project'}
        </button>
      </div>

      {showCreateForm && (
        <div className="project-form-card">
          <h2>Create Project</h2>

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
                placeholder="Enter project name"
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
                placeholder="Enter project description"
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
        <p>Loading projects...</p>
      )}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        projects.length === 0 && (
          <p>No projects found.</p>
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
                  <h2>{project.name}</h2>

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
                    Created{' '}
                    {new Date(
                      project.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
    </section>
  );
}