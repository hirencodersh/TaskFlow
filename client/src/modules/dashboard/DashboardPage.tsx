export default function DashboardPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome to TaskFlow. Here’s an overview of your workspace.
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span>Total Projects</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-stat-card">
          <span>Total Tasks</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-stat-card">
          <span>In Progress</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-stat-card">
          <span>Completed</span>
          <strong>0</strong>
        </div>
      </div>
    </section>
  );
}