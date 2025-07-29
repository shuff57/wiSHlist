import React from 'react';
import { Header } from '../layout/Header';
import { Link } from 'react-router-dom';

export const AboutView: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Header title="About" showSettingsButton={false} showSignoutButton={false} showLoginButton={true} />
      
      {/* Overview and Features Section */}
      <div className="max-w-4xl mx-auto px-4 pb-12 pt-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">📖 About wiSHlist</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            wiSHlist is a modern, user-friendly wishlist application designed specifically for teachers to create and share classroom supply wishlists with supporters. Built with React, TypeScript, and Appwrite, it empowers educators to create organized wishlists of classroom supplies and materials, making it easy for parents, community members, and supporters to contribute to student success.
          </p>
        </div>

        <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">✨ For Teachers</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">📋</span>
                <span><strong>Wishlist Management:</strong> Create and manage multiple wishlists with drag-and-drop reordering</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">🎨</span>
                <span><strong>Customizable Items:</strong> Add items with names, descriptions, store links, and estimated costs</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">👥</span>
                <span><strong>User Management:</strong> Invite and manage recommenders and administrators</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">📊</span>
                <span><strong>Contribution Tracking:</strong> Monitor which items have been purchased and by how many contributors</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">🔗</span>
                <span><strong>Easy Sharing:</strong> Generate shareable links and keys for public wishlist access</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">🛍️ For Supporters</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">🔍</span>
                <span><strong>Easy Browsing:</strong> View wishlists in list or grid layout</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">📝</span>
                <span><strong>Item Details:</strong> See item descriptions, costs, and store links</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">✅</span>
                <span><strong>Purchase Tracking:</strong> Mark items as purchased to prevent duplicates</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">🌐</span>
                <span><strong>Direct Links:</strong> Quick access to store pages for purchasing</span>
              </li>
              <li className="flex items-start">
                <span className="text-sky-600 mr-2">💡</span>
                <span><strong>Suggestions:</strong> Recommend new items to teachers</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">🔧 Technical Features</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">🌙</span>
              <span><strong>Dark/Light Mode:</strong> Automatic theme switching</span>
            </div>
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">🔐</span>
              <span><strong>Secure Authentication:</strong> User registration and login with Appwrite</span>
            </div>
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">📦</span>
              <span><strong>Real-time Updates:</strong> Live synchronization of wishlist changes</span>
            </div>
            <div className="flex items-start">
              <span className="text-sky-600 mr-2">🎯</span>
              <span><strong>Modern UI:</strong> Clean, intuitive interface built with Tailwind CSS</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">📚 Need Help Getting Started?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Visit our complete documentation and installation guide for detailed setup instructions.
            </p>
            <a 
              href="https://github.com/shuff57/wiSHlist" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-800 transition duration-200 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="flex gap-4 justify-center">
            <Link 
              to="/"
              className="inline-flex items-center bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition duration-200 font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
