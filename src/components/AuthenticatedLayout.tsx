import React from 'react';
import AppNavbar from './AppNavbar';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-cover" style={{
      backgroundImage: 'url("/Header-background.webp")',
      backgroundPosition: 'center 30%'
    }}>
      <AppNavbar />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default AuthenticatedLayout; 