/**
 * Dev entry point — renders the App with a stub auth adapter
 * so the UI can be run locally via `npm run dev`.
 * Auto-logins with stub credentials for seamless dev experience.
 */
import '@crewspace/ui/styles';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../App.js';
import { stubAuthAdapter } from './stubAuthAdapter.js';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element in index.html');
}

createRoot(root).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(App, { authAdapter: stubAuthAdapter }),
  ),
);
