import React, { useState, useEffect } from 'react';
import { account } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models } from 'appwrite';
import { Heart, Save, ArrowLeft } from 'lucide-react';

export const Settings: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [name, setName] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        setName(loggedInUser.name);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || name === user.name) return;
    setSaving(true);

    try {
      await account.updateName(name);
      alert('Name updated successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold">Profile Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
               <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline flex items-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
               </button>
               {user?.$id === '68817300de763e596523' && (
                <button onClick={() => navigate('/admin')} className="text-blue-600 hover:underline">Admin</button>
               )}
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="space-y-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div>
                <label className="block text-sm font-medium">Display Name</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700"
                />
              </div>
              <div className="text-right">
                <button
                  type="submit"
                  disabled={saving || name === user?.name}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Dark Mode</label>
                <button onClick={() => setDarkMode(!darkMode)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
