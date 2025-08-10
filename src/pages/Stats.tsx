import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import StatsOverview from '@/components/StatsOverview';

const Stats = () => {
  const { user } = useAuth();

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Statistics</h1>
          <p className="text-gray-600">Your building analytics and progress insights</p>
        </div>

        {/* Stats Content */}
        <StatsOverview />
      </div>
    </AuthenticatedLayout>
  );
};

export default Stats; 