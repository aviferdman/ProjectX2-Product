/**
 * SettingsPage — styled settings view.
 * TASK-131: Protected page scaffold.
 */
import React from 'react';
import { Card, CardHeader, CardBody } from '@crewspace/ui';

export function SettingsPage(): React.JSX.Element {
  return (
    <main
      data-testid="settings-page"
      className="min-h-screen bg-surface-app p-6"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Settings</h1>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Manage your account preferences and API keys.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary">
                Customize the look and feel of your workspace.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
