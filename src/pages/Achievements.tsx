import React from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const Achievements = () => {
  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Achievements</h1>
        <p className="text-gray-600">Track badges, streaks, and milestones.</p>
      </div>
    </AuthenticatedLayout>
  );
};

export default Achievements;

