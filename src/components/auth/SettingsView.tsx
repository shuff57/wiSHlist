import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../layout/Header';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Header title="Settings" showBackButton={true} onBack={() => navigate('/dashboard')} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Account Information</h2>
          {user ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="mt-1 text-lg text-gray-900 dark:text-gray-200">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="mt-1 text-lg text-gray-900 dark:text-gray-200">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Loading user information...</p>
          )}
        </div>
      </main>
    </div>
  );
};