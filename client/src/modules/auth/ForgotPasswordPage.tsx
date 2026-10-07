import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordReset } from './auth.api';
import { ArrowLeft } from 'lucide-react';

const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [serverMessage, setServerMessage] =
    useState('');
  const [serverError, setServerError] =
    useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (
    values: ForgotFormData,
  ) => {
    setServerError('');
    setServerMessage('');

    try {
      const response =
        await requestPasswordReset(values.email);

      setServerMessage(
        response.message ||
          'If the email exists, a password reset link has been sent to your email.',
      );
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: {
              data?: { message?: string };
            };
          }
        )?.response?.data?.message ??
        'Failed to request password reset. Please try again.';

      setServerError(message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>
            Enter your email and we'll send you a
            password reset link.
          </p>
        </div>

        {serverMessage ? (
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                color: '#16a34a',
                fontSize: '14px',
                marginBottom: '20px',
                fontWeight: 600,
              }}
            >
              {serverMessage}
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
              <ArrowLeft size={16} /> Back to Sign
              In
            </Link>
          </div>
        ) : (
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
                {...register('email')}
              />

              {errors.email && (
                <p className="form-error">
                  {errors.email.message}
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
                ? 'Sending link...'
                : 'Send Reset Link'}
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
