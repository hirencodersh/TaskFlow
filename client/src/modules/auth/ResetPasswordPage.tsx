import { useState } from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPassword } from './auth.api';
import {
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const resetSchema = z.object({
  password: z
    .string()
    .min(
      8,
      'Password must be at least 8 characters',
    ),
});

type ResetFormData = z.infer<
  typeof resetSchema
>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token =
    searchParams.get('token') || '';

  const [success, setSuccess] =
    useState(false);
  const [serverError, setServerError] =
    useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (
    values: ResetFormData,
  ) => {
    setServerError('');

    if (!token) {
      setServerError(
        'Missing or invalid reset token.',
      );
      return;
    }

    try {
      await resetPassword(
        token,
        values.password,
      );
      setSuccess(true);
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: {
              data?: { message?: string };
            };
          }
        )?.response?.data?.message ??
        'Failed to reset password. The token may be invalid or expired.';

      setServerError(message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>New Password</h1>
          <p>
            Please enter your new password
            below.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                color: '#16a34a',
                marginBottom: '12px',
              }}
            >
              <CheckCircle2
                size={40}
                style={{ margin: '0 auto' }}
              />
            </div>

            <p
              style={{
                color: '#16a34a',
                fontSize: '14px',
                marginBottom: '20px',
                fontWeight: 600,
              }}
            >
              Your password has been reset
              successfully.
            </p>

            <Link
              to="/login"
              className="task-back-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <ArrowLeft size={16} /> Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="auth-form"
          >
            <div className="form-group">
              <label htmlFor="password">
                New Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register('password')}
              />

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
              disabled={
                isSubmitting || !token
              }
            >
              {isSubmitting
                ? 'Resetting...'
                : 'Reset Password'}
            </button>

            <div
              style={{
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              <Link
                to="/login"
                className="task-back-link"
              >
                <ArrowLeft size={14} /> Back to
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
