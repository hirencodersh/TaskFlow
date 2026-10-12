import { Link } from 'react-router-dom';
import {
  ListTodo,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-logo">
            <span className="landing-logo-icon"></span>
            <span>TaskFlow</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#benefits">Benefits</a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-signin-btn">
              Sign In
            </Link>
            <Link to="/register" className="landing-getstarted-btn">
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <Sparkles size={14} />
            <span>Next-Generation Project & Task Management</span>
          </div>
          <h1>
            Streamline Workflows, Empower Teams, <span className="gradient-text">Deliver Faster.</span>
          </h1>
          <p>
            TaskFlow brings projects, tasks, real-time collaboration, and role-based permissions together in one gorgeous, blazing-fast workspace designed for high-performing teams.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-primary-btn">
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing-secondary-btn">
              Sign In to Workspace
            </Link>
          </div>
          <div className="landing-hero-perks">
            <span>
              <CheckCircle2 size={16} color="#059669" /> No credit card required
            </span>
            <span>
              <CheckCircle2 size={16} color="#059669" /> Real-time updates
            </span>
            <span>
              <CheckCircle2 size={16} color="#059669" /> Role-based security
            </span>
          </div>
        </div>

        <div className="landing-hero-preview">
          <div className="landing-preview-card">
            <div className="preview-header">
              <div className="preview-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="preview-title">TaskFlow Workspace</span>
            </div>
            <div className="preview-body">
              <div className="preview-stat-row">
                <div className="preview-stat">
                  <span>Active Projects</span>
                  <strong>12</strong>
                </div>
                <div className="preview-stat">
                  <span>Tasks Completed</span>
                  <strong>148</strong>
                </div>
              </div>
              <div className="preview-task-item">
                <span className="task-status-badge status-in_progress">In Progress</span>
                <p>Implement WebSocket synchronization for live updates</p>
              </div>
              <div className="preview-task-item">
                <span className="task-status-badge status-done">Done</span>
                <p>Refactor role-based permissions and activity logging</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <span className="section-eyebrow">Powerful Capabilities</span>
          <h2>Designed for modern engineering & product teams</h2>
          <p>Everything you need to plan, track, and ship projects without the friction.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-indigo">
              <Zap size={22} />
            </div>
            <h3>Real-Time Collaboration</h3>
            <p>Experience instant synchronization across your team via WebSockets. See task updates and comments as they happen.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-blue">
              <ShieldCheck size={22} />
            </div>
            <h3>Role-Based Security</h3>
            <p>Strict access controls for Admins, Project Managers, and Developers ensuring secure and predictable workflows.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-orange">
              <ListTodo size={22} />
            </div>
            <h3>Advanced Task Tracking</h3>
            <p>Filter by status, priority, and assignees. Attach files via Cloudinary and discuss details directly in tasks.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-emerald">
              <Activity size={22} />
            </div>
            <h3>Comprehensive Audit Logs</h3>
            <p>Never lose track of changes. Every project creation, task update, and member action is logged automatically.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-how">
        <div className="section-header">
          <span className="section-eyebrow">Simple 3-Step Process</span>
          <h2>How TaskFlow works</h2>
          <p>Get your team onboarded and shipping in minutes.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01</span>
            <h3>Create a Project</h3>
            <p>Set up your project name, description, timeline, and status in seconds.</p>
          </div>

          <div className="step-card">
            <span className="step-number">02</span>
            <h3>Invite Your Team</h3>
            <p>Assign roles (Admin, PM, Developer) and add members to your workspace projects.</p>
          </div>

          <div className="step-card">
            <span className="step-number">03</span>
            <h3>Track & Deliver</h3>
            <p>Manage tasks on Kanban boards, collaborate in real-time, and hit your deadlines.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-banner">
        <div className="cta-content">
          <h2>Ready to elevate your team's productivity?</h2>
          <p>Join thousands of professionals who manage their workflows smarter with TaskFlow.</p>
          <Link to="/register" className="landing-primary-btn cta-btn">
            Get Started For Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="landing-logo-icon"></span>
              <span>TaskFlow</span>
            </div>
            <p>© {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
