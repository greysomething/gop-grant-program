import React from 'react';
import HomePage from './Home';

// The root route should show the Home page (with hero section)
// This ensures non-logged-in users see the proper landing page
export default function IndexPage() {
  return <HomePage />;
}