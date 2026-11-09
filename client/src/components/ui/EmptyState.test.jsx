import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EmptyState from './EmptyState';

test('renders empty state title and description', () => {
  render(
    <ThemeProvider theme={createTheme()}>
      <EmptyState title="No items" description="Nothing here yet" />
    </ThemeProvider>
  );
  expect(screen.getByText('No items')).toBeInTheDocument();
  expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
});
