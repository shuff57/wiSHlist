import React from 'react';
import { WishlistItem } from '../../types';
import { Heart, ExternalLink, CheckCircle, Gift, Settings } from 'lucide-react';

interface WishlistViewProps {
  user: { name: string; role: string };
  items: WishlistItem[];
  teacherName: string;
  onLogout: () => void;
  onAdminView: () => void;
  onMarkContribution: (itemId: number) => void;
  customWishForm: {
    itemName: string;
    description: string;
    storeLink: string;
    estimatedCost: string;
  };
  onCustomWishFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmitCustomWish: (e: React.FormEvent) => void;
  onUpdateTeacherName: (newName: string) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  user,
  items,
  teacherName,
  onLogout,
  onAdminView,
  onMarkContribution,
  customWishForm,
  onCustomWishFormChange,
  onSubmitCustomWish,
  onUpdateTeacherName
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <input type="text" value={teacherName} onChange={(e) => onUpdateTeacherName(e.target.value)} onDoubleClick={(e) => (e.target as HTMLInputElement).select()} className="text-xl font-bold text-gray-800 bg-transparent" />
                <p className="text-sm text-gray-600">3rd Grade Supply Wishlist</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.role === 'admin' && (
                <button
                  onClick={onAdminView}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Admin
                </button>
              )}
              <span className="text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={onLogout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Help Our Students Learn & Grow</h2>
          <p className="text-gray-600">Your contributions make a real difference in our classroom. Thank you for supporting education!</p>
        </div>

        {/* Wishlist Items */}
        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600 font-medium">{item.cost}</span>
                    <span className="text-blue-600 flex items-center">
                      <Gift className="w-4 h-4 mr-1" />
                      {item.contributions} contributions
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-6">
                  <a
                    href={item.storeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm font-medium"
                  >
                    Purchase <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                  <button
                    onClick={() => onMarkContribution(item.id)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    I bought this
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Wish Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Suggest a New Item</h3>
          <p className="text-gray-600 mb-4">Have an idea for something our classroom could use? Submit your suggestion!</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="itemName"
                placeholder="Item name"
                value={customWishForm.itemName}
                onChange={onCustomWishFormChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                name="estimatedCost"
                placeholder="Estimated cost (e.g., $15.99)"
                value={customWishForm.estimatedCost}
                onChange={onCustomWishFormChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <textarea
              name="description"
              placeholder="Description - why would this be helpful for the classroom?"
              value={customWishForm.description}
              onChange={onCustomWishFormChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
            <input
              type="url"
              name="storeLink"
              placeholder="Link to store (optional)"
              value={customWishForm.storeLink}
              onChange={onCustomWishFormChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={onSubmitCustomWish}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200 font-medium"
            >
              Submit Suggestion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
