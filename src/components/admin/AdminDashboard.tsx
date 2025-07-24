import React, { useState, useEffect } from 'react';
import { Heart, Plus, Clock, User, ExternalLink } from 'lucide-react';
import { CustomRequest, AdminForm, WishlistItem } from '../../types';
import { LINK_EXPIRY_OPTIONS, INITIAL_CUSTOM_REQUESTS, INITIAL_WISHLIST_ITEMS } from '../../constants';
import { account, databases, databaseId, invitesCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID } from 'appwrite';

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [adminForm, setAdminForm] = useState<AdminForm>({ 
    itemName: '', 
    description: '', 
    storeLink: '', 
    cost: '' 
  });
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [registrationLink, setRegistrationLink] = useState('');
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>(INITIAL_CUSTOM_REQUESTS);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(INITIAL_WISHLIST_ITEMS);
  const [teacherName, setTeacherName] = useState("Ms. Johnson");
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
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

  const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const addNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: WishlistItem = {
      id: wishlistItems.length + 1,
      name: adminForm.itemName,
      description: adminForm.description,
      storeLink: adminForm.storeLink,
      cost: adminForm.cost,
      contributions: 0
    };
    setWishlistItems([...wishlistItems, newItem]);
    setAdminForm({ itemName: '', description: '', storeLink: '', cost: '' });
  };

  const generateLink = async () => {
    try {
      const token = ID.unique();
      const expiryTime = new Date(Date.now() + parseInt(linkExpiry, 10) * 60 * 60 * 1000);
      
      await databases.createDocument(databaseId, invitesCollectionId, token, {
        token: token,
        expiresAt: expiryTime.toISOString(),
        usedBy: ''
      });

      const link = `${window.location.origin}/register?token=${token}`;
      setRegistrationLink(link);
    } catch (error) {
      console.error("Error generating registration link:", error);
      alert("Could not generate registration link. See console for details.");
    }
  };

  const approveCustomRequest = (requestId: number) => {
    const request = customRequests.find(r => r.id === requestId);
    if (request) {
      const newItem: WishlistItem = {
        id: wishlistItems.length + 1,
        name: request.itemName,
        description: request.description,
        storeLink: request.storeLink,
        cost: request.estimatedCost,
        contributions: 0
      };
      setWishlistItems([...wishlistItems, newItem]);
      setCustomRequests(customRequests.filter(r => r.id !== requestId));
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
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Wishlist
              </button>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Item */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Item
            </h2>
            <form onSubmit={addNewItem} className="space-y-4">
              <input
                type="text"
                name="itemName"
                placeholder="Item name"
                value={adminForm.itemName}
                onChange={handleAdminFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={adminForm.description}
                onChange={handleAdminFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
              <input
                type="url"
                name="storeLink"
                placeholder="Store link"
                value={adminForm.storeLink}
                onChange={handleAdminFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                name="cost"
                placeholder="Cost (e.g., $12.99)"
                value={adminForm.cost}
                onChange={handleAdminFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200"
              >
                Add to Wishlist
              </button>
            </form>
          </div>

          {/* Generate Registration Link */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Generate Registration Link
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
              {registrationLink && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Registration link:</p>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Update Teacher Name
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Teacher Name"
                defaultValue={teacherName}
                onBlur={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Custom Requests */}
        {customRequests.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Pending Requests ({customRequests.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {customRequests.map(request => (
                <div key={request.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{request.itemName}</h3>
                      <p className="text-gray-600 mt-1">{request.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Requested by: {request.requestedBy}</span>
                        <span>Cost: {request.estimatedCost}</span>
                        {request.storeLink && (
                          <a
                            href={request.storeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            View Item <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => approveCustomRequest(request.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setCustomRequests(reqs => reqs.filter(r => r.id !== request.id))}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
