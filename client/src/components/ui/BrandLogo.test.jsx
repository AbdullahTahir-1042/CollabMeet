import { render, screen } from '@testing-library/react';
import BrandLogo from './BrandLogo';

test('renders brand logo image', () => {
  render(<BrandLogo />);
  expect(screen.getByAltText(/CollabMeet/i)).toBeInTheDocument();
});
