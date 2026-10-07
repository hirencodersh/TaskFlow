import { useState } from 'react';
import {
  useForm,
} from 'react-hook-form';
import { z } from 'zod';
import {
  zodResolver,
} from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

import { login } from './auth.api';
import {
  useAuthStore,
} from '../../store/auth.store';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email'),

  password: z
    .string()
    .min(
      8,
      'Password must be at least 8 characters',
    ),
});

type LoginFormData =
  z.infer<typeof loginSchema>;

export default function LoginPage() {
  const setAuth =
    useAuthStore(
      (state) => state.setAuth,
    );

  const [serverError, setServerError] =
    useState('');

  const {
    register: registerField,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormData>({
    resolver:
      zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (
    values: LoginFormData,
  ) => {
    setServerError('');

    try {
      const response =
        await login(values);

      setAuth(
        response.data.user,
        response.data.accessToken,
      );
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please try again.';

      setServerError(message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>TaskFlow</h1>

          <p>
            Sign in to manage your projects
            and tasks.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form"
        >
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...registerField('email')}
            />

            {errors.email && (
              <p className="form-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...registerField('password')}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: 'var(--tf-primary, #6366f1)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {errors.password && (
              <p className="form-error">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="form-error">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Signing in...'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}