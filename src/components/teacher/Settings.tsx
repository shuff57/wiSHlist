import React, { useState, useEffect, useCallback } from 'react';
import { account, databases, databaseId, usersCollectionId, invitesCollectionId, feedbackCollectionId, wishlistsCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Save, User, UserPlus, Check, Search, Edit3, MessageSquare, CheckCircle, X, Trash2 } from 'lucide-react';
import { LINK_EXPIRY_OPTIONS } from '../../constants';
import { Header } from '../layout/Header';
import { Tooltip } from '../common/Tooltip';
import { EditableAboutView } from '../auth/EditableAboutView';
import { WishlistPreview } from './WishlistPreview';

interface UserDoc {
  name: string;
  email: string;
  role: string;
  isRecommender: boolean;
  isAdmin: boolean;
  userID?: string; // ID of the admin who invited this user
}

const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: 'Issue/Bug' },
  { value: 'feature', label: 'Feature/Enhancement' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' }
];

export const Settings: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userDoc, setUserDoc] = useState<(Models.Document & UserDoc) | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  
  // State from AdminDashboard
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [isRecommenderInvite, setIsRecommenderInvite] = useState(false);
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Models.Document & UserDoc)[]>([]);
  const [showAboutEditor, setShowAboutEditor] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // Feedback Manager State
  const [feedback, setFeedback] = useState<Models.Document[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Models.Document | null>(null);
  const [showFeedbackManager, setShowFeedbackManager] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [showPreview, setShowPreview] = useState(false);
  const [wishlists, setWishlists] = useState<Models.Document[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const isRootAdmin = user?.name.toLowerCase().includes('huff') || user?.email.toLowerCase().includes('huff');



  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        setName(loggedInUser.name);
        
        // Try to fetch user document, but don't fail if it doesn't exist
        try {
          const doc = await databases.getDocument(databaseId, usersCollectionId, loggedInUser.$id);
          console.log("📄 Found user document:", doc);
          console.log("🔐 isAdmin:", doc.isAdmin, "🔗 isRecommender:", doc.isRecommender);
          
          // Check if this is Mr. Huff and ensure admin privileges
          const isMrHuff = loggedInUser.name.toLowerCase().includes('huff') || 
                          loggedInUser.email.toLowerCase().includes('huff');
          
          if (isMrHuff && (!doc.isAdmin || !doc.isRecommender)) {
            console.log("👑 Updating Mr. Huff's privileges to admin");
            try {
              const updatedDoc = await databases.updateDocument(
                databaseId,
                usersCollectionId,
                loggedInUser.$id,
                {
                  isAdmin: true,
                  isRecommender: true
                }
              );
              setUserDoc(updatedDoc as Models.Document & UserDoc);
            } catch (updateError) {
              console.error("Failed to update Mr. Huff's privileges:", updateError);
              setUserDoc(doc as Models.Document & UserDoc);
            }
          } else {
            setUserDoc(doc as Models.Document & UserDoc);
          }
          
          if ((doc as any).isAdmin || (doc as any).isRecommender || isMrHuff) {
            console.log("👑 User has admin/recommender privileges");
            console.log("🆔 Your user ID:", loggedInUser.$id);
          }
        } catch (docError) {
          console.log("📄 User document not found, attempting to fetch updated document");
          
          // Check if this is Mr. Huff (the main admin) - always give admin privileges
          const isMrHuff = loggedInUser.name.toLowerCase().includes('huff') || 
                          loggedInUser.email.toLowerCase().includes('huff');
          
          console.log("🔍 Is Mr. Huff?", isMrHuff, "Name:", loggedInUser.name, "Email:", loggedInUser.email);
          
          // Try to create the document first, but if it fails (already exists), 
          // try one more time to fetch it with a slight delay
          try {
            const newDoc = await databases.createDocument(
              databaseId,
              usersCollectionId,
              loggedInUser.$id,
              {
                name: loggedInUser.name,
                email: loggedInUser.email,
                role: 'teacher', // Add the missing role field
                isRecommender: isMrHuff, // Mr. Huff gets both privileges
                isAdmin: isMrHuff,       // Mr. Huff is always admin
                name_lowercase: loggedInUser.name.toLowerCase()
                // Note: No userID field for Mr. Huff since he's the main admin
              }
            );
            console.log("✅ Created user document:", newDoc);
            setUserDoc(newDoc as Models.Document & UserDoc);
            
            if (isMrHuff) {
              console.log("👑 Mr. Huff privileges set");
            }
          } catch (createError) {
            console.log("❌ Failed to create user document, trying to fetch existing document:", createError);
            
            // Wait a moment and try to fetch the existing document
            setTimeout(async () => {
              try {
                const existingDoc = await databases.getDocument(databaseId, usersCollectionId, loggedInUser.$id);
                console.log("✅ Successfully fetched existing user document:", existingDoc);
                setUserDoc(existingDoc as Models.Document & UserDoc);
              } catch (fetchError) {
                console.error("❌ Failed to fetch existing document, using fallback:", fetchError);
                // Set default userDoc values as fallback, but give Mr. Huff admin privileges
                setUserDoc({
                  $id: loggedInUser.$id,
                  name: loggedInUser.name,
                  email: loggedInUser.email,
                  role: 'teacher', // Add the missing role field
                  isRecommender: isMrHuff,
                  isAdmin: isMrHuff
                } as unknown as Models.Document & UserDoc);
              }
            }, 1000);
          }
        }

      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!user) {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        let queries = [];
        if (!isRootAdmin) { // Only show users YOU invited, unless you are the root admin
          queries.push(Query.equal('userID', user.$id));
        }
        
        // If there's a search query, add the name filter
        if (searchQuery.trim() !== '') {
          console.log("🔍 Searching for users with:");
          console.log("  - Name starts with:", searchQuery.toLowerCase());
          console.log("  - Current user ID:", user.$id);
          queries.push(Query.startsWith('name_lowercase', searchQuery.toLowerCase()));
        } else {
          console.log("📋 Loading all users you invited");
        }
        
        // Search for users you invited (with optional name filter)
        const response = await databases.listDocuments(
          databaseId,
          usersCollectionId,
          queries
        );
        
        console.log("📋 Users you invited:", response.documents.map(u => ({ 
          name: u.name, 
          userID: u.userID || 'NO_USER_ID',
          id: u.$id,
          isAdmin: u.isAdmin || false,
          isRecommender: u.isRecommender || false
        })));
        
        setSearchResults(response.documents as (Models.Document & UserDoc)[]);
        console.log("🔍 Results for users you invited:", response.documents.length);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setLoadingSearch(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user, isRootAdmin]);

  useEffect(() => {
    const fetchWishlists = async () => {
      if (user) {
        try {
          const response = await databases.listDocuments(
            databaseId,
            wishlistsCollectionId,
            [Query.equal('teacher_id', user.$id)]
          );
          setWishlists(response.documents);
        } catch (error) {
          console.error("Failed to fetch wishlists:", error);
        }
      }
    };
    fetchWishlists();
  }, [user]);

  // Fetch feedback
  const fetchFeedback = useCallback(async () => {
    if (!isRootAdmin) return;
    
    setLoadingFeedback(true);
    try {
      const response = await databases.listDocuments(databaseId, feedbackCollectionId);
      setFeedback(response.documents);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  }, [isRootAdmin]);

  // Handle feedback deletion
  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      await databases.deleteDocument(databaseId, feedbackCollectionId, feedbackId);
      setFeedback(prev => prev.filter(f => f.$id !== feedbackId));
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  // Update feedback status
  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      await databases.updateDocument(databaseId, feedbackCollectionId, feedbackId, {
        status: newStatus
      });
      setFeedback(prev => prev.map(f => 
        f.$id === feedbackId ? { ...f, status: newStatus } : f
      ));
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const handleUpdateFeedbackCategory = async (feedbackId: string, newCategory: string) => {
    try {
      await databases.updateDocument(databaseId, feedbackCollectionId, feedbackId, {
        category: newCategory
      });
      setFeedback(prev => prev.map(f => 
        f.$id === feedbackId ? { ...f, category: newCategory } : f
      ));
    } catch (error) {
      console.error('Error updating feedback category:', error);
    }
  };

  // Filter feedback based on status and category
  const filteredFeedback = feedback.filter(item => {
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  // Load feedback when component mounts
  useEffect(() => {
    if (isRootAdmin && !loading) {
      fetchFeedback();
    }
  }, [isRootAdmin, loading, fetchFeedback]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || name === user.name) return;
    setSaving(true);

    try {
      await account.updateName(name);

      // Update the user's document in the usersCollectionId
      if (userDoc) {
        await databases.updateDocument(
          databaseId,
          usersCollectionId,
          userDoc.$id,
          { name: name, name_lowercase: name.toLowerCase() }
        );
        setUserDoc(prev => prev ? { ...prev, name: name } : null);
      }

      // Update teacher_name in all wishlists associated with this user
      if (user) {
        console.log(`Attempting to update wishlists for user ID: ${user.$id}`);
        const wishlistsResponse = await databases.listDocuments(
          databaseId,
          wishlistsCollectionId,
          [Query.equal('teacher_id', user.$id)]
        );

        console.log(`Found ${wishlistsResponse.documents.length} wishlists for user ID: ${user.$id}`);

        for (const wishlist of wishlistsResponse.documents) {
          console.log(`Updating wishlist ID: ${wishlist.$id} with teacher_name: ${name}`);
          await databases.updateDocument(
            databaseId,
            wishlistsCollectionId,
            wishlist.$id,
            { teacher_name: name }
          );
        }
      }

      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000); // Show checkmark for 2 seconds
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };
  
  // Functions from AdminDashboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log("Clipboard API failed, using fallback method:", error);
      // Fallback method: create a temporary textarea element
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('execCommand failed');
        }
      } catch (fallbackError) {
        console.error("Both clipboard methods failed:", fallbackError);
        // Show the text in a prompt as last resort
        prompt('Copy this link manually:', text);
      }
    }
  };

  const generateLink = async () => {
    if (!user) {
      console.error("No user found, cannot generate link");
      alert("Error: No user session found. Please refresh and try again.");
      return;
    }
    
    setLoadingLink(true);
    console.log("🚀 Starting link generation...");
    console.log("📄 User:", user);
    console.log("⏰ Link expiry:", linkExpiry, "hours");
    console.log("🔗 Recommender invite:", isRecommenderInvite);
    console.log("👑 Admin invite:", isAdminInvite);
    
    try {
      const token = ID.unique();
      const expiryTime = new Date(Date.now() + parseInt(linkExpiry, 10) * 60 * 60 * 1000);
      
      console.log("🎫 Generated token:", token);
      console.log("⏰ Expiry time:", expiryTime.toISOString());
      console.log("📊 Database IDs:", { databaseId, invitesCollectionId });
      
      const inviteData = {
        token: token,
        expiresAt: expiryTime.toISOString(),
        isRecommender: isRecommenderInvite,
        isAdmin: isAdminInvite,
        userID: user.$id // Track who created this invitation
      };
      
      console.log("📝 Creating invite document with data:", inviteData);
      
      const createdDoc = await databases.createDocument(databaseId, invitesCollectionId, token, inviteData);
      
      console.log("✅ Successfully created invite document:", createdDoc);

      const link = `${window.location.origin}/register?token=${token}`;
      setRegistrationLink(link);
      console.log("🔗 Generated invitation link:", link);
    } catch (error) {
      console.error("❌ Error generating registration link:", error);
      if (error instanceof Error) {
        alert(`Error generating link: ${error.message}`);
      } else {
        alert("Unknown error occurred while generating link. Check console for details.");
      }
    } finally {
      setLoadingLink(false);
    }
  };

  const toggleUserStatus = async (targetUser: Models.Document & UserDoc, field: 'isRecommender' | 'isAdmin') => {
    try {
      console.log(`🔄 Toggling ${field} for user:`, targetUser.name, "Current value:", targetUser[field]);
      
      // Calculate new values with admin->recommender logic
      let newIsAdmin = targetUser.isAdmin;
      let newIsRecommender = targetUser.isRecommender;
      
      if (field === 'isAdmin') {
        newIsAdmin = !targetUser.isAdmin;
        // If granting admin privileges, automatically grant recommender too
        if (newIsAdmin && !newIsRecommender) {
          newIsRecommender = true;
          console.log("👑 Granting admin privileges - automatically enabling recommender as well");
        }
      } else if (field === 'isRecommender') {
        newIsRecommender = !targetUser.isRecommender;
        // If removing recommender privileges and user is admin, remove admin too (since admin requires recommender)
        if (!newIsRecommender && newIsAdmin) {
          newIsAdmin = false;
          console.log("⬇️ Removing recommender privileges - automatically removing admin as well");
        }
      }
      
      let updatedUser: Models.Document & UserDoc;
      try {
        // Try to update the existing document
        updatedUser = await databases.updateDocument(
          databaseId,
          usersCollectionId,
          targetUser.$id,
          { 
            isAdmin: newIsAdmin,
            isRecommender: newIsRecommender
          }
        ) as Models.Document & UserDoc;
        console.log(`✅ Updated privileges for user:`, targetUser.name, 
          `Admin: ${targetUser.isAdmin} -> ${newIsAdmin}, Recommender: ${targetUser.isRecommender} -> ${newIsRecommender}`);
      } catch (updateError) {
        console.log(`❌ Failed to update user document, trying to create it:`, updateError);
        
        // If update fails (document doesn't exist), create the document
        try {
          updatedUser = await databases.createDocument(
            databaseId,
            usersCollectionId,
            targetUser.$id,
            {
              name: targetUser.name,
              email: targetUser.email,
              role: 'teacher',
              isRecommender: newIsRecommender,
              isAdmin: newIsAdmin,
              name_lowercase: targetUser.name.toLowerCase(),
              userID: user?.$id // Track who created this user
            }
          ) as Models.Document & UserDoc;
          console.log(`✅ Created user document with privileges:`, targetUser.name, 
            `Admin: ${newIsAdmin}, Recommender: ${newIsRecommender}`);
        } catch (createError) {
          console.error(`❌ Failed to create user document:`, createError);
          throw createError;
        }
      }
      
      // If this is the current user, update userDoc state
      if (targetUser.$id === user?.$id) {
        console.log("📝 Updating current user's userDoc state");
        setUserDoc(updatedUser);
      }
      
      setSearchResults(prev => 
        prev.map(u => u.$id === targetUser.$id ? updatedUser : u)
      );
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  // Filter out the current user from the display list
  const filteredSearchResults = searchResults.filter(u => u.$id !== user?.$id);

  console.log("🎯 Settings render - userDoc:", userDoc);
  console.log("🔐 isAdmin:", userDoc?.isAdmin, "🔗 isRecommender:", userDoc?.isRecommender);
  console.log("📝 Should show registration link?", (userDoc?.isRecommender || userDoc?.isAdmin));
  console.log("⚙️ Should show user management?", userDoc?.isAdmin);
  console.log("🎛️ Should show privilege toggles in invitation?", userDoc?.isAdmin);
  console.log("🔍 Search results (excluding current user):", filteredSearchResults.length);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header title="Profile Settings" showBackButton={true} showSettingsButton={false} showInfoButton={true} isLoading={loading || loadingSearch} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Display Name Section - Always visible */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8">
          <div className="space-y-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Supporter View Display Name</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-grow block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 h-10"
                    disabled={loading}
                  />
                  <Tooltip text="Save your new display name">
                    <button
                      type="submit"
                      disabled={saving || name === user?.name || loading}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white h-10 transition-colors duration-200 ${nameSaved ? 'bg-green-600' : 'bg-sky-600 hover:bg-sky-800'} disabled:bg-gray-400`}
                    >
                      {nameSaved ? (
                        <div className="flex items-center space-x-1">
                          <Check className="w-5 h-5" />
                          <span>Saved!</span>
                        </div>
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                    </button>
                  </Tooltip>
                </div>
                <div className="mt-4">
                  <Tooltip text="View a demo of your wiSHlist">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white h-10 transition-colors duration-200 bg-sky-600 hover:bg-sky-800 disabled:bg-gray-400"
                    >
                      View wiSHlist
                    </button>
                  </Tooltip>
                </div>
              </div>
            </form>
            {showPreview && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Preview Wishlist</h3>
                <div className="space-y-4">
                  <select
                    onChange={(e) => {
                      const wishlistKey = e.target.value;
                      if (wishlistKey) {
                        setSelectedWishlist(wishlistKey);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-neutral-800"
                  >
                    <option value="">Select a wishlist</option>
                    {wishlists.map((wishlist) => (
                      <option key={wishlist.$id} value={wishlist.wishlist_key}>
                        {wishlist.wishlist_name || wishlist.wishlist_key}
                      </option>
                    ))}
                  </select>
                  {selectedWishlist && (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <WishlistPreview wishlistKey={selectedWishlist} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share Link Section - Visible for recommenders and admins */}
        {(userDoc?.isRecommender || userDoc?.isAdmin) && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Generate Teacher Invitation Link
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Link expires in:</label>
                <select value={linkExpiry} onChange={(e) => setLinkExpiry(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700">
                  {LINK_EXPIRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {userDoc?.isAdmin && (
                <div className="flex justify-around items-center pt-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Recommender:</label>
                    <button onClick={() => {
                      const newRecommender = !isRecommenderInvite;
                      setIsRecommenderInvite(newRecommender);
                      // If removing recommender, also remove admin (since admin requires recommender)
                      if (!newRecommender && isAdminInvite) {
                        setIsAdminInvite(false);
                      }
                    }} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isRecommenderInvite ? 'bg-sky-600 hover:bg-sky-800' : 'bg-gray-300 hover:bg-gray-500'}`}>
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isRecommenderInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Admin:</label>
                    <button onClick={() => {
                      const newAdmin = !isAdminInvite;
                      setIsAdminInvite(newAdmin);
                      // If granting admin, also grant recommender (since admin requires recommender)
                      if (newAdmin && !isRecommenderInvite) {
                        setIsRecommenderInvite(true);
                      }
                    }} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isAdminInvite ? 'bg-sky-600 hover:bg-sky-800' : 'bg-gray-300 hover:bg-gray-500'}`}>
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAdminInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </div>
                </div>
              )}
              {/* Show info message for recommender-only users */}
              {userDoc?.isRecommender && !userDoc?.isAdmin && (
                <div className="pt-4 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p>ℹ️ As a Recommender, you can invite new teachers with basic access. Only Admins can grant special privileges.</p>
                </div>
              )}
              <button 
                onClick={generateLink} 
                disabled={loadingLink}
                className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingLink ? 'Generating...' : 'Generate Link'}
              </button>
              {registrationLink && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Invitation link generated successfully!
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Share this link with a new teacher to give them access:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={registrationLink} 
                      readOnly 
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                    />
                    <Tooltip text="Copy to clipboard">
                      <button 
                        onClick={() => handleCopy(registrationLink)} 
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                          copied 
                            ? 'bg-green-600 text-white' 
                            : 'bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500'
                        }`}
                      >
                        {copied ? (
                          <div className="flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </div>
                        ) : (
                          'Copy'
                        )}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage User Permissions Section - Only visible for admins */}
        {userDoc?.isAdmin && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Manage User Permissions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Search below to find users you have invited and manage their permissions.
            </p>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a teacher by name..."
                className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
              <Search className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            <div className="mt-4">
              {/* User Results - Show all invited users when searching, or only privileged users when not searching */}
              {!loadingSearch && (
                <div className="space-y-4">
                  {(() => {
                    // If searching, show all results. If not searching, only show privileged users
                    const usersToShow = searchQuery.trim() 
                      ? filteredSearchResults 
                      : filteredSearchResults.filter(user => user.isAdmin || user.isRecommender);
                    
                    return usersToShow.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No users found.</p>
                        <p className="text-sm mt-1">
                          {searchQuery.trim() 
                            ? 'No users match your search.' 
                            : 'No users with privileges yet. Use search to find and grant privileges to invited users.'}
                        </p>
                      </div>
                    ) : (
                      usersToShow.map(foundUser => (
                        <div key={foundUser.$id} className="p-4 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{foundUser.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{foundUser.email}</p>
                              {(foundUser.isAdmin || foundUser.isRecommender) && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  {foundUser.isAdmin && foundUser.isRecommender ? 'Admin & Recommender' :
                                   foundUser.isAdmin ? 'Admin' : 'Recommender'}
                                </p>
                              )}
                            </div>
                            {/* Show toggles for all users */}
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">Recommender:</label>
                                <button onClick={() => toggleUserStatus(foundUser, 'isRecommender')} className={`relative inline-flex items-center h-6 rounded-full w-11 ${foundUser.isRecommender ? 'bg-sky-600 hover:bg-sky-800' : 'bg-gray-300 hover:bg-gray-500'}`}>
                                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${foundUser.isRecommender ? 'translate-x-6' : 'translate-x-1'}`}/>
                                </button>
                              </div>
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">Admin:</label>
                                <button onClick={() => toggleUserStatus(foundUser, 'isAdmin')} className={`relative inline-flex items-center h-6 rounded-full w-11 ${foundUser.isAdmin ? 'bg-sky-600 hover:bg-sky-800' : 'bg-gray-300 hover:bg-gray-500'}`}>
                                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${foundUser.isAdmin ? 'translate-x-6' : 'translate-x-1'}`}/>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Manager Section - Only visible for root admin */}
        {isRootAdmin && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Feedback Manager
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Manage user feedback and track resolution status for all submitted feedback.
            </p>
            <div className="space-y-4">
              {!showFeedbackManager ? (
                <button 
                  onClick={() => setShowFeedbackManager(true)}
                  className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Feedback Manager
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium">Feedback Manager</h3>
                    <button 
                      onClick={() => setShowFeedbackManager(false)}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Close Manager
                    </button>
                  </div>
                  <div className="rounded-lg p-4 bg-neutral-900">
                    {/* Combined Filters and Feedback Content */}
                    <div className="space-y-6">
                      {/* Filters */}
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

                      {/* Feedback List */}
                      {loadingFeedback ? (
                        <div className="text-center py-4">Loading feedback...</div>
                      ) : filteredFeedback.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No feedback matches the current filters.</div>
                      ) : (
                        <div className="space-y-4">
                          {filteredFeedback.map((item) => (
                            <div key={item.$id} className="border dark:border-neutral-600 rounded-lg p-4 bg-white dark:bg-neutral-800">
                              {/* Header with user info and metadata */}
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
                                    <select
                                      value={item.category}
                                      onChange={(e) => handleUpdateFeedbackCategory(item.$id, e.target.value)}
                                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                                        item.category === 'bug' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                        item.category === 'feature' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                        item.category === 'question' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                        item.category === 'other' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                                        'bg-neutral-200 text-gray-800 dark:bg-neutral-700 dark:text-gray-200'
                                      }`}
                                    >
                                      {FEEDBACK_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                      ))}
                                    </select>
                                  )}
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-200 text-gray-800 dark:bg-neutral-700 dark:text-gray-200">
                                    {item.status || 'pending'}
                                  </span>
                                </div>
                              </div>

                              {/* Feedback Description */}
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Feedback Description:</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {item.message || item.description || 'No description provided'}
                                </p>
                              </div>

                              {/* Status Update Buttons */}
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <button
                                  onClick={() => handleUpdateFeedbackStatus(item.$id, 'in-progress')}
                                  className="px-2 py-1 text-xs rounded-lg transition-all duration-200 flex items-center gap-1 bg-neutral-200 text-gray-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                                  title="Mark as In Progress"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  In Progress
                                </button>

                                <button
                                  onClick={() => handleUpdateFeedbackStatus(item.$id, 'resolved')}
                                  className="px-2 py-1 text-xs rounded-lg transition-all duration-200 flex items-center gap-1 bg-neutral-200 text-gray-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Resolved
                                </button>

                                <button
                                  onClick={() => handleUpdateFeedbackStatus(item.$id, 'closed')}
                                  className="px-2 py-1 text-xs rounded-lg transition-all duration-200 flex items-center gap-1 bg-neutral-200 text-gray-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                                  title="Mark as Closed"
                                >
                                  <X className="w-3 h-3" />
                                  Closed
                                </button>

                                <div className="ml-auto">
                                  <button
                                    onClick={() => {
                                      setFeedbackToDelete(item);
                                      setShowDeleteModal(true);
                                    }}
                                    className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-all duration-200"
                                    title="Delete Feedback"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit About Page Section - Only visible for admins */}
        {userDoc?.isAdmin && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Edit3 className="w-5 h-5 mr-2" />
              Edit About Page
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Manage the content displayed on the About page for all users.
            </p>
            <div className="space-y-4">
              {!showAboutEditor ? (
                <button 
                  onClick={() => setShowAboutEditor(true)}
                  className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Open About Page Editor
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium">About Page Editor</h3>
                    <button 
                      onClick={() => setShowAboutEditor(false)}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Close Editor
                    </button>
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <EditableAboutView />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && feedbackToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Feedback</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this feedback? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFeedbackToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFeedback(feedbackToDelete.$id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};