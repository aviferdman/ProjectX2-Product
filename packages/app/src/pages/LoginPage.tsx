/**
 * LoginPage — placeholder login view.
 * TASK-131: Auth scaffold page.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/index.js';
import { ROUTES } from '../router/routes.js';

export function LoginPage(): React.JSX.Element {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: string } | undefined)?.from ?? ROUTES.DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    navigate(from, { replace: true });
  };

  return React.createElement(
    'main',
    { 'data-testid': 'login-page' },
    React.createElement('h1', null, 'Sign in to Crewspace'),
    error && React.createElement('p', { role: 'alert', 'data-testid': 'login-error' }, error),
    React.createElement(
      'form',
      { onSubmit: handleSubmit, 'aria-label': 'Login form' },
      React.createElement('label', { htmlFor: 'email' }, 'Email'),
      React.createElement('input', {
        id: 'email',
        type: 'email',
        value: email,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
        required: true,
      }),
      React.createElement('label', { htmlFor: 'password' }, 'Password'),
      React.createElement('input', {
        id: 'password',
        type: 'password',
        value: password,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        required: true,
      }),
      React.createElement(
        'button',
        { type: 'submit', disabled: isLoading },
        isLoading ? 'Signing in…' : 'Sign in',
      ),
    ),
  );
}
