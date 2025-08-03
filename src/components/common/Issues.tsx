import React, { useState, useEffect, useCallback } from 'react';
import { databases, databaseId, feedbackCollectionId } from '../../appwriteConfig';
import { Models } from 'appwrite';
import { MessageSquare, Search } from 'lucide-react';
import { Header } from '../layout/Header';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Issues: React.FC = () => {
  const [feedback, setFeedback] = useState<Models.Document[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();


  // Fetch feedback
  const fetchFeedback = useCallback(async () => {
    setLoadingFeedback(true);
    try {
      const response = await databases.listDocuments(databaseId, feedbackCollectionId);
      setFeedback(response.documents);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  // Filter feedback based on status and category
  const filteredFeedback = feedback.filter(item => {
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    const searchMatch = searchQuery.trim() === '' || 
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (item.message && item.message.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && categoryMatch && searchMatch;
  });

  // Load feedback when component mounts
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Handler for supporter back button in header
  const handleSupporterBack = () => {
    const lastVisitedWishlist = sessionStorage.getItem('lastVisitedWishlist');
    if (lastVisitedWishlist) {
      navigate(`/wishlist/${lastVisitedWishlist}`);
    } else {
      navigate('/supporter');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header
        title="Current Issues"
        showBackButton={!user}
        onBack={handleSupporterBack}
        showSettingsButton={!!user}
        showInfoButton={true}
        isLoading={loadingFeedback}
        hideIssuesButton={true}
        showLoginButton={true}
      />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Current Issues
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            View and manage reported issues.
          </p>
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues by description..."
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
            <Search className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-neutral-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-neutral-800"
                  >
                    <option value="all">All</option>
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Category:</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-neutral-800"
                  >
                    <option value="all">All</option>
                    <option value="bug">Issue/Bug</option>
                    <option value="feature">Feature/Enhancement</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {loadingFeedback ? (
                <div className="text-center py-4">Loading issues...</div>
              ) : filteredFeedback.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No issues match the current filters.</div>
              ) : (
                <div className="space-y-4">
                  {filteredFeedback.map((item) => (
                    <div key={item.$id} className="border dark:border-neutral-600 rounded-lg p-4 bg-white dark:bg-neutral-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-sm">{item.username || item.name || 'Anonymous User'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.$createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {item.email && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              📧 {item.email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.category && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              item.category === 'bug' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              item.category === 'feature' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              item.category === 'question' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              item.category === 'other' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {item.category}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            item.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            item.status === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {item.status || 'pending'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Issue Description:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {item.message || item.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};