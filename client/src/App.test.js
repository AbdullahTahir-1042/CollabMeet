import React from 'react';
import { render, screen } from '@testing-library/react';

// Keep App smoke test lightweight by mocking heavy route/context modules.
jest.mock('./views/VideoCall', () => () => <div>VideoCall</div>);
jest.mock('./views/Chat', () => () => <div>ChatHome</div>);
jest.mock('./views/Meetings', () => () => <div>MeetingsPage</div>);
jest.mock('./views/Auth', () => () => <div>AuthPage</div>);
jest.mock('./components/layout/AppShell', () => ({ children }) => <div data-testid="shell">{children}</div>);
jest.mock('./SocketContext', () => ({ ContextProvider: ({ children }) => <>{children}</> }));

import App from './App';

test('renders app routes without crashing', async () => {
  window.location.hash = '#/';
  render(<App />);
  expect(await screen.findByText('ChatHome')).toBeInTheDocument();
});
