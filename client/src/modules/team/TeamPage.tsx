import { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, Mail, CheckCircle2, X } from 'lucide-react';
import { getTeamMembers, inviteTeamMember, type TeamMember } from './team.api';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA'>('DEVELOPER');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  async function loadTeam() {
    try {
      setIsLoading(true);
      setError('');
      const response = await getTeamMembers();
      setMembers(response.data.members);
    } catch (err) {
      console.error('Failed to load team members:', err);
      setError('Unable to load team members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setInviteError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setInviteError('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      await inviteTeamMember({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      setName('');
      setEmail('');
      setPassword('');
      setRole('DEVELOPER');
      setShowInviteModal(false);
      await loadTeam();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to invite team member.';
      setInviteError(msg);
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <section className="admin-users-page">
      <div className="admin-users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1><Users size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> PM Team Management</h1>
          <p>Invite and manage team members by email. Approved team members will appear in project-member dropdowns.</p>
        </div>

        <button
          type="button"
          className="create-task-button"
          onClick={() => {
            setInviteError('');
            setShowInviteModal(true);
          }}
        >
          <UserPlus size={17} /> Add / Invite User
        </button>
      </div>

      <div className="admin-users-card">
        {isLoading ? (
          <div className="admin-users-empty">
            <Users size={32} />
            <p>Loading team members...</p>
          </div>
        ) : error ? (
          <div className="admin-users-empty admin-users-error">
            <p>{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="admin-users-empty">
            <Users size={32} />
            <p>No team members found.</p>
          </div>
        ) : (
          <>
            <div className="admin-users-table-header">
              <span>Name</span>
              <span><Mail size={13} /> Email</span>
              <span><Shield size={13} /> Role</span>
              <span>Status</span>
              <span>Joined</span>
            </div>

            {members.map((member) => (
              <div key={member.id} className="admin-user-row">
                <span>
                  <div className="admin-user-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {member.name}
                </span>

                <span>{member.email}</span>

                <span>
                  <span className={`admin-role-badge admin-role-${member.role.toLowerCase().replace('_', '-')}`}>
                    <Shield size={11} /> {member.role.replace('_', ' ')}
                  </span>
                </span>

                <span>
                  <span className="admin-status-badge admin-status-active">
                    <CheckCircle2 size={11} /> Approved
                  </span>
                </span>

                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {new Date(member.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {showInviteModal && (
        <div className="add-member-modal">
          <div className="add-member-modal-card">
            <div className="add-member-modal-header">
              <h2>Add / Invite Team Member</h2>
              <button type="button" onClick={() => !isInviting && setShowInviteModal(false)}>
                <X size={20} />
              </button>
            </div>

            {inviteError ? <p className="form-error">{inviteError}</p> : null}

            <form onSubmit={handleInvite}>
              <div className="project-form-group">
                <label htmlFor="team-name">Full Name</label>
                <input
                  id="team-name"
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isInviting}
                />
              </div>

              <div className="project-form-group">
                <label htmlFor="team-email">Email Address</label>
                <input
                  id="team-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>

              <div className="project-form-group">
                <label htmlFor="team-password">Password</label>
                <input
                  id="team-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isInviting}
                />
              </div>

              <div className="project-form-group">
                <label htmlFor="team-role">Role</label>
                <select
                  id="team-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'PROJECT_MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'QA')}
                  disabled={isInviting}
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="DESIGNER">Designer</option>
                  <option value="QA">QA</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                </select>
              </div>

              <div className="add-member-modal-actions">
                <button type="button" onClick={() => !isInviting && setShowInviteModal(false)} disabled={isInviting}>
                  Cancel
                </button>
                <button type="submit" disabled={isInviting || !name.trim() || !email.trim() || !password.trim()}>
                  {isInviting ? 'Inviting...' : 'Invite Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
