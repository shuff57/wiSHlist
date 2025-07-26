import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Header } from '../layout/Header';

export const SupporterLanding: React.FC = () => {
  const [key, setKey] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      navigate(`/wishlist/${key.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Supporter" showSettingsButton={false} showSignoutButton={false} />
      <div className="flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Classroom Wishlist</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Enter a teacher's wishlist key to view their list.</p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              placeholder="Enter Wishlist Key"
              required
            />
            <button
              type="submit"
              className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Find Wishlist
            </button>
          </form>
          
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Are you a teacher? <Link to="/" className="text-blue-600 hover:underline">Login here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};
