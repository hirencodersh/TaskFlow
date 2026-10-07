import {
  CheckCircle2,
  CircleDot,
  FolderKanban,
  ListTodo,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getProjects } from '../projects/projects.api';
import { getTasks, type Task } from '../tasks/tasks.api';

export default function DashboardPage() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError('');

        const [projectsResponse, tasksResponse] =
          await Promise.all([
            getProjects(),
            getTasks({
              page: 1,
              limit: 5,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            }),
          ]);

        setTotalProjects(
          projectsResponse.data.pagination?.total ??
            projectsResponse.data.projects.length,
        );

        const tasks = tasksResponse.data.tasks;

        setTotalTasks(
          tasksResponse.data.pagination.total,
        );

        setInProgress(
          tasks.filter(
            (task) => task.status === 'IN_PROGRESS',
          ).length,
        );

        setCompleted(
          tasks.filter(
            (task) => task.status === 'DONE',
          ).length,
        );

        setRecentTasks(tasks);
      } catch (error) {
        console.error(
          'Failed to load dashboard data:',
          error,
        );

        setError(
          'Unable to load dashboard data. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              Workspace
            </span>

            <h1>Dashboard</h1>

            <p>Loading your workspace...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              Workspace
            </span>

            <h1>Dashboard</h1>

            <p className="dashboard-error">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const statCards = [
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: FolderKanban,
      className: 'projects',
    },
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: ListTodo,
      className: 'tasks',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: CircleDot,
      className: 'progress',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      className: 'completed',
    },
  ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            Workspace overview
          </span>

          <h1>Dashboard</h1>

          <p>
            Welcome to TaskFlow. Here’s an overview
            of your workspace.
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className={`dashboard-stat-card ${stat.className}`}
            >
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon">
                  <Icon size={20} />
                </span>

                <span className="dashboard-stat-label">
                  {stat.label}
                </span>
              </div>

              <strong>{stat.value}</strong>
            </div>
          );
        })}
      </div>

      <div className="dashboard-recent-tasks">
        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-section-eyebrow">
              Latest activity
            </span>

            <h2>Recent Tasks</h2>
          </div>

          <Link
            to="/tasks"
            className="dashboard-view-all"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="dashboard-empty">
            <ListTodo size={28} />

            <h3>No recent tasks</h3>

            <p>
              Tasks assigned to your workspace will
              appear here.
            </p>
          </div>
        ) : (
          <div className="dashboard-task-list">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="dashboard-task-card"
              >
                <div className="dashboard-task-main">
                  <div className="dashboard-task-icon">
                    <ListTodo size={18} />
                  </div>

                  <div>
                    <h3>{task.title}</h3>

                    <span className="dashboard-task-project">
                      {task.project.name}
                    </span>
                  </div>
                </div>

                <div className="dashboard-task-meta">
                  <span
                    className={`task-status-badge status-${task.status.toLowerCase()}`}
                  >
                    {task.status.replace(
                      '_',
                      ' ',
                    )}
                  </span>

                  <span
                    className={`task-priority-badge priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>

                  <ArrowRight
                    className="dashboard-task-arrow"
                    size={17}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}