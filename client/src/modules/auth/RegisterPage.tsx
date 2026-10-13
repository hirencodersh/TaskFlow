import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

import { register } from './auth.api';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'QA'], {
    message: 'Please select a valid position',
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined,
    },
  });

  const onSubmit = async (values: RegisterFormData) => {
    setServerError('');
    setSuccessMessage('');

    try {
      await register(values);

      setSuccessMessage(
        'Registration successful! Pending Admin approval; log in after approval.',
      );
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';

      setServerError(message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="landing-logo" style={{ justifyContent: 'center', marginBottom: '12px' }}>
            <span className="landing-logo-icon"></span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>TaskFlow</span>
          </div>
          <h1>Create an account</h1>
          <p>Get started with your free TaskFlow workspace today.</p>
        </div>

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                background: '#ecfdf5',
                color: '#047857',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #a7f3d0',
                fontSize: '15px',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {successMessage}
            </div>
            <Link
              to="/login"
              className="auth-submit-btn"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                textAlign: 'center',
                lineHeight: '42px',
              }}
            >
              Sign In to Workspace
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...registerField('name')}
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerField('email')}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  {...registerField('password')}
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="role">Position</label>
                <select
                  id="role"
                  {...registerField('role')}
                  defaultValue=""
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: '#fff' }}
                >
                  <option value="" disabled>Select Position</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="DESIGNER">Designer</option>
                  <option value="QA">QA</option>
                </select>
                {errors.role && <p className="form-error">{errors.role.message}</p>}
              </div>

              {serverError && <p className="form-error">{serverError}</p>}

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--tf-muted, #64748b)' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ color: 'var(--tf-primary, #6366f1)', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
