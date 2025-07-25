import React, { useState, useEffect } from 'react';
import { Heart, User } from 'lucide-react';
import { LINK_EXPIRY_OPTIONS } from '../../constants';
import { account, databases, databaseId, invitesCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID } from 'appwrite';

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [registrationLink, setRegistrationLink] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        // In a real app, you'd also check if the user has an 'admin' role here.
      } catch (error) {
        navigate('/login');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const generateLink = async () => {
    setError('');
    setRegistrationLink('');
    try {
      const token = ID.unique();
      const expiryTime = new Date(Date.now() + parseInt(linkExpiry, 10) * 60 * 60 * 1000);
      
      await databases.createDocument(databaseId, invitesCollectionId, token, {
        token: token,
        expiresAt: expiryTime.toISOString(),
      });

      const link = `${window.location.origin}/register?token=${token}`;
      setRegistrationLink(link);
    } catch (error) {
      console.error("Error generating registration link:", error);
      setError("Could not generate registration link. Check console for details.");
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-800">Platform Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Generate Teacher Invitation Link
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link expires in:
              </label>
              <select
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LINK_EXPIRY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={generateLink}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Generate Link
            </button>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {registrationLink && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Share this link with a new teacher:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={registrationLink}
                    readOnly
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(registrationLink)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
