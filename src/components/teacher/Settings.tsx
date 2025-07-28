import React, { useState, useEffect } from 'react';
import { account, databases, databaseId, usersCollectionId, invitesCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Save, User, UserPlus, Check, Search } from 'lucide-react';
import { LINK_EXPIRY_OPTIONS } from '../../constants';
import { Header } from '../layout/Header';
import { Tooltip } from '../common/Tooltip';

interface UserDoc {
  name: string;
  email: string;
  role: string;
  isRecommender: boolean;
  isAdmin: boolean;
  userID?: string; // ID of the admin who invited this user
}

export const Settings: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userDoc, setUserDoc] = useState<(Models.Document & UserDoc) | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State from AdminDashboard
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [isRecommenderInvite, setIsRecommenderInvite] = useState(false);
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Models.Document & UserDoc)[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const navigate = useNavigate();

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
        let queries = [Query.equal('userID', user.$id)]; // Only show users YOU invited
        
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
  }, [searchQuery, user]);

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
      
      let updatedUser: Models.Document & UserDoc;
      try {
        // Try to update the existing document
        updatedUser = await databases.updateDocument(
          databaseId,
          usersCollectionId,
          targetUser.$id,
          { [field]: !targetUser[field] }
        ) as Models.Document & UserDoc;
        console.log(`✅ Updated ${field} for user:`, targetUser.name, "New value:", updatedUser[field]);
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
              isRecommender: field === 'isRecommender' ? !targetUser[field] : (targetUser.isRecommender || false),
              isAdmin: field === 'isAdmin' ? !targetUser[field] : (targetUser.isAdmin || false),
              name_lowercase: targetUser.name.toLowerCase(),
              userID: user?.$id // Track who created this user
            }
          ) as Models.Document & UserDoc;
          console.log(`✅ Created user document with ${field}:`, targetUser.name, "New value:", updatedUser[field]);
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

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

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
      <Header title="Profile Settings" showBackButton={true} showSettingsButton={false} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Display Name Section - Always visible */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8">
          <div className="space-y-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
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
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-800 disabled:bg-gray-400 h-10"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </form>
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
                    <button onClick={() => setIsRecommenderInvite(!isRecommenderInvite)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isRecommenderInvite ? 'bg-sky-600 hover:bg-sky-800' : 'bg-gray-300 hover:bg-gray-500'}`}>
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isRecommenderInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Admin:</label>
                    <button onClick={() => setIsAdminInvite(!isAdminInvite)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isAdminInvite ? 'bg-sky-600 hover:bg-sky-800' : 'bg-gray-300 hover:bg-gray-500'}`}>
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
              {loadingSearch && <p>Loading...</p>}
              
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
      </main>
    </div>
  );
};