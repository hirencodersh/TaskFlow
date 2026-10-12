import {
  FolderKanban,
  ListTodo,
  ArrowRight,
  AlertTriangle,
  Users,
  Shield,
  CheckCircle2,
  CircleDot,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardAnalytics, type AnalyticsData } from './dashboard.api';
import { getProjects, type Project } from '../projects/projects.api';
import { formatDate } from '../../lib/date';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProjectsList() {
      try {
        const res = await getProjects();
        setProjects(res.data.projects);
      } catch {
        // ignore
      }
    }
    loadProjectsList();
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError('');
        const response = await getDashboardAnalytics({
          projectId: selectedProjectId || undefined,
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to load dashboard analytics:', error);
        setError('Unable to load dashboard analytics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [selectedProjectId]);

  if (isLoading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">Workspace</span>
            <h1>Dashboard</h1>
            <p>Loading your role-specific dashboard...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !analytics) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">Workspace</span>
            <h1>Dashboard</h1>
            <p className="dashboard-error">{error || 'Failed to load analytics.'}</p>
          </div>
        </div>
      </section>
    );
  }

  const role = analytics.role;

  // Calculate PM metrics
  const ownedProjectsCount = analytics.ownedProjects?.length ?? 0;
  const activeProjectsCount = analytics.ownedProjects?.filter((p) => p.status === 'ACTIVE').length ?? 0;
  const upcomingDeadlinesCount = analytics.upcomingDeadlines?.length ?? 0;
  const pmOverdueCount = analytics.overdueTasks?.length ?? 0;

  // Calculate IC metrics (Developer, Designer, QA)
  const assignedTasksCount = analytics.assignedTasks?.length ?? analytics.stats?.totalAssigned ?? 0;
  const inProgressCount = analytics.assignedTasks?.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length ?? 0;
  const completedCount = analytics.assignedTasks?.filter((t) => t.status === 'DONE').length ?? 0;
  const icOverdueCount = analytics.overdueTasks?.length ?? 0;

  return (
    <section className="dashboard-page">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="dashboard-eyebrow">
            <Shield size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            {role.replace('_', ' ')} Workspace Overview
          </span>
          <h1>Dashboard</h1>
          <p>Real-time analytics and metrics calculated from your workspace database.</p>
        </div>

        {/* Project Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--tf-border)', background: '#fff', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ADMIN DASHBOARD (4 Cards + Analytical Charts) */}
      {role === 'ADMIN' && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card projects">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><Users size={20} /></span>
                <span className="dashboard-stat-label">Total Users</span>
              </div>
              <strong>{analytics.stats?.totalUsers ?? 0}</strong>
            </div>

            <div className="dashboard-stat-card tasks">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><FolderKanban size={20} /></span>
                <span className="dashboard-stat-label">Total Projects</span>
              </div>
              <strong>{analytics.stats?.totalProjects ?? 0}</strong>
            </div>

            <div className="dashboard-stat-card progress">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><ListTodo size={20} /></span>
                <span className="dashboard-stat-label">Total Tasks</span>
              </div>
              <strong>{analytics.stats?.totalTasks ?? 0}</strong>
            </div>

            <div className="dashboard-stat-card completed">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><AlertTriangle size={20} /></span>
                <span className="dashboard-stat-label">Overdue Tasks</span>
              </div>
              <strong>{analytics.overdueTasks?.length ?? 0}</strong>
            </div>
          </div>

          {/* Admin Analytical Charts & Distributions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }}>
            {/* Task Status Distribution Chart */}
            <div className="dashboard-recent-tasks">
              <div className="dashboard-section-header">
                <div>
                  <span className="dashboard-section-eyebrow"><BarChart3 size={14} style={{ display: 'inline' }} /> Analytics</span>
                  <h2>Task Status Distribution</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((st) => {
                  const match = analytics.stats?.tasksByStatus?.find((s) => s.status === st);
                  const count = match?._count?.id ?? 0;
                  const total = analytics.stats?.totalTasks || 1;
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={st} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        <span>{st.replace('_', ' ')}</span>
                        <span>{count} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: st === 'DONE' ? '#10b981' : st === 'IN_PROGRESS' ? '#3b82f6' : st === 'IN_REVIEW' ? '#f59e0b' : '#64748b', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Workload */}
            <div className="dashboard-recent-tasks">
              <div className="dashboard-section-header">
                <div>
                  <span className="dashboard-section-eyebrow">Workload</span>
                  <h2>Team Workload</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', maxHeight: '280px', overflowY: 'auto' }}>
                {analytics.teamWorkload?.map((member) => (
                  <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <div>
                      <strong>{member.name}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{member.role.replace('_', ' ')}</span>
                    </div>
                    <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700 }}>
                      {member._count?.assignedTasks ?? member.activeTasksCount ?? 0} active tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Activity */}
            <div className="dashboard-recent-tasks">
              <div className="dashboard-section-header">
                <div>
                  <span className="dashboard-section-eyebrow">Audit Trail</span>
                  <h2>System Activity</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', maxHeight: '280px', overflowY: 'auto' }}>
                {analytics.recentActivity?.slice(0, 5).map((log) => (
                  <div key={log.id} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{log.actor.name}</strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(log.createdAt)}</span>
                    </div>
                    <span style={{ color: '#475569' }}>{log.action.replace('_', ' ')} {log.project ? `in ${log.project.name}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PROJECT MANAGER DASHBOARD (4 Cards + PM Analytics) */}
      {role === 'PROJECT_MANAGER' && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card projects">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><FolderKanban size={20} /></span>
                <span className="dashboard-stat-label">Owned Projects</span>
              </div>
              <strong>{ownedProjectsCount}</strong>
            </div>

            <div className="dashboard-stat-card progress">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><CircleDot size={20} /></span>
                <span className="dashboard-stat-label">Active Projects</span>
              </div>
              <strong>{activeProjectsCount}</strong>
            </div>

            <div className="dashboard-stat-card tasks">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><Clock size={20} /></span>
                <span className="dashboard-stat-label">Upcoming Deadlines</span>
              </div>
              <strong>{upcomingDeadlinesCount}</strong>
            </div>

            <div className="dashboard-stat-card completed">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><AlertTriangle size={20} /></span>
                <span className="dashboard-stat-label">Overdue Tasks</span>
              </div>
              <strong>{pmOverdueCount}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }}>
            <div className="dashboard-recent-tasks">
              <div className="dashboard-section-header">
                <div>
                  <span className="dashboard-section-eyebrow">Portfolio</span>
                  <h2>Owned Projects Progress</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {analytics.ownedProjects?.map((proj) => (
                  <Link key={proj.id} to={`/projects/${proj.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', color: 'inherit' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>{proj.name}</strong>
                      <span className={`project-status project-status-${proj.status.toLowerCase()}`}>{proj.status}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{proj._count.tasks} tasks</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="dashboard-recent-tasks">
              <div className="dashboard-section-header">
                <div>
                  <span className="dashboard-section-eyebrow"><BarChart3 size={14} style={{ display: 'inline' }} /> Breakdown</span>
                  <h2>Project Task Status Breakdown</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((st) => {
                  const match = analytics.stats?.tasksByStatus?.find((s) => s.status === st);
                  const count = match?._count?.id ?? 0;
                  const total = analytics.ownedProjects?.reduce((acc, p) => acc + p._count.tasks, 0) || 1;
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={st} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        <span>{st.replace('_', ' ')}</span>
                        <span>{count} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: st === 'DONE' ? '#10b981' : st === 'IN_PROGRESS' ? '#3b82f6' : st === 'IN_REVIEW' ? '#f59e0b' : '#64748b', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dashboard-recent-tasks">
              <div className="dashboard-section-header">
                <div>
                  <span className="dashboard-section-eyebrow">Schedule</span>
                  <h2>Upcoming Deadlines</h2>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', maxHeight: '280px', overflowY: 'auto' }}>
                {analytics.upcomingDeadlines?.map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px' }}>{task.title}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{task.project.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>Due {formatDate(task.dueDate)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* DEVELOPER / DESIGNER / QA DASHBOARD (4 Cards) */}
      {['DEVELOPER', 'DESIGNER', 'QA'].includes(role) && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card tasks">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><ListTodo size={20} /></span>
                <span className="dashboard-stat-label">Assigned Tasks</span>
              </div>
              <strong>{assignedTasksCount}</strong>
            </div>

            <div className="dashboard-stat-card progress">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><CircleDot size={20} /></span>
                <span className="dashboard-stat-label">In Progress / Review</span>
              </div>
              <strong>{inProgressCount}</strong>
            </div>

            <div className="dashboard-stat-card completed">
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon"><CheckCircle2 size={20} /></span>
                <span className="dashboard-stat-label">Completed Tasks</span>
              </div>
              <strong>{completedCount}</strong>
            </div>

            <div className="dashboard-stat-card completed" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
              <div className="dashboard-stat-top">
                <span className="dashboard-stat-icon" style={{ background: '#ffe4e6', color: '#e11d48' }}><AlertTriangle size={20} /></span>
                <span className="dashboard-stat-label" style={{ color: '#9f1239' }}>Overdue Work</span>
              </div>
              <strong style={{ color: '#be123c' }}>{icOverdueCount}</strong>
            </div>
          </div>

          <div className="dashboard-recent-tasks" style={{ marginTop: '32px' }}>
            <div className="dashboard-section-header">
              <div>
                <span className="dashboard-section-eyebrow">My Queue</span>
                <h2>Assigned Tasks</h2>
              </div>
              <Link to="/tasks" className="dashboard-view-all">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            {analytics.assignedTasks?.length === 0 ? (
              <div className="dashboard-empty">
                <ListTodo size={28} />
                <h3>No tasks assigned</h3>
                <p>You have no tasks assigned in this workspace.</p>
              </div>
            ) : (
              <div className="dashboard-task-list" style={{ marginTop: '16px' }}>
                {analytics.assignedTasks?.map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="dashboard-task-card">
                    <div className="dashboard-task-main">
                      <div className="dashboard-task-icon">
                        <ListTodo size={18} />
                      </div>
                      <div>
                        <h3>{task.title}</h3>
                        <span className="dashboard-task-project">{task.project.name}</span>
                      </div>
                    </div>

                    <div className="dashboard-task-meta">
                      <span className={`task-status-badge status-${task.status.toLowerCase()}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`task-priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <ArrowRight className="dashboard-task-arrow" size={17} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
