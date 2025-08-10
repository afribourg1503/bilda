import React from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const Leaderboards = () => {
  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Leaderboards</h1>
        <p className="text-gray-600">See top builders by time, streaks, and impact.</p>
      </div>
    </AuthenticatedLayout>
  );
};

export default Leaderboards;

