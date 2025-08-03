import React, { useState, useEffect, useCallback, useRef } from 'react';
import { databases, databaseId, wishlistsCollectionId, usersCollectionId, itemsCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Plus, Check, Share2, Pencil, Trash2, X, GripVertical, Copy } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { Header } from '../layout/Header';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useStrictDroppable } from '../../hooks/useStrictDroppable';

interface WishlistDoc {
  teacher_name: string;
  wishlist_key: string;
  wishlist_name?: string;
}

interface UserDoc {
  isRecommender: boolean;
  isAdmin: boolean;
}

export const TeacherDashboard: React.FC = () => {
  const { user, loading: authLoading, ensureUserDocument } = useAuth();
  const [userDoc, setUserDoc] = useState<Models.Document & UserDoc | null>(null);
  const [wishlists, setWishlists] = useState<(Models.Document & WishlistDoc)[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingWishlistId, setEditingWishlistId] = useState<string | null>(null);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [wishlistToDelete, setWishlistToDelete] = useState<string | null>(null);
  const [enabled] = useStrictDroppable(loading || authLoading);
  const [isInitializing, setIsInitializing] = useState(false); // Prevent duplicate calls
  const [rateLimited, setRateLimited] = useState(false); // Track rate limit status
  const initializationRef = useRef<string | null>(null); // Track which user is being initialized
  const navigate = useNavigate();

  // Function to wait and retry when rate limited
  const retryAfterRateLimit = async (retryFn: () => Promise<any>, delayMs: number = 5000) => {
    setRateLimited(true);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    setRateLimited(false);
    return await retryFn();
  };

  const fetchUserData = useCallback(async (userId: string, userName: string, userEmail: string) => {
    let doc = null;
    
    try {
        // First, try to get the existing document using user ID as document ID
        doc = await databases.getDocument(databaseId, usersCollectionId, userId);
    } catch (e: any) {
        if (e.code === 404) {
            // Document doesn't exist, try to create it
            
            const userDocData = { 
                name: userName || 'Unknown User', 
                email: userEmail || 'unknown@email.com', 
                role: 'teacher', 
                isRecommender: false, 
                isAdmin: false 
            };
            
            try {
                doc = await databases.createDocument(
                    databaseId, 
                    usersCollectionId, 
                    userId, // Use user ID as document ID
                    userDocData
                );
            } catch (createError: any) {
                
                if (createError.code === 409) {
                    // Document was created by another process (likely React StrictMode), try to fetch it
                    try {
                        // Try multiple times with increasing delays
                        for (let attempt = 1; attempt <= 3; attempt++) {
                            await new Promise(res => setTimeout(res, attempt * 500)); // Increasing delay
                            try {
                                doc = await databases.getDocument(databaseId, usersCollectionId, userId);
                                break; // Success, exit the retry loop
                            } catch (fetchError: any) {
                                if (attempt === 3) {
                                }
                            }
                        }
                    } catch (retryError) {
                    }
                } else if (createError.code === 429) {
                    // Rate limit exceeded - wait and retry once
                    try {
                        doc = await retryAfterRateLimit(async () => {
                            return await databases.createDocument(
                                databaseId, 
                                usersCollectionId, 
                                userId,
                                userDocData
                            );
                        });
                    } catch (retryError: any) {
                    }
                } else {
                }
            }
        } else {
        }
    }

    if (doc) {
        setUserDoc(doc as Models.Document & UserDoc);
        try {
            const response = await databases.listDocuments(
                databaseId, wishlistsCollectionId, [Query.equal('teacher_id', userId)]
            );
            setWishlists(response.documents as (Models.Document & WishlistDoc)[]);
        } catch (error) {
        }
    } else {
        // Set a minimal user doc so the UI can function
        setUserDoc({
            $id: 'temp',
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString(),
            $permissions: [],
            $collectionId: usersCollectionId,
            $databaseId: databaseId,
            isRecommender: false,
            isAdmin: false
        } as Models.Document & UserDoc);
        
        // Still try to fetch wishlists
        try {
            const response = await databases.listDocuments(
                databaseId, wishlistsCollectionId, [Query.equal('teacher_id', userId)]
            );
            setWishlists(response.documents as (Models.Document & WishlistDoc)[]);
        } catch (error) {
            setWishlists([]);
        }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && !isInitializing) {
      // Prevent duplicate initialization for the same user
      if (initializationRef.current === user.$id) {
        return;
      }
      
      
      setIsInitializing(true);
      initializationRef.current = user.$id;
      
      const initializeUser = async () => {
        try {
          // Ensure user document exists
          await ensureUserDocument();
          
          // Now fetch the user data and wishlists
          await fetchUserData(user.$id, user.name, user.email);
        } catch (error) {
        } finally {
          setLoading(false);
          setIsInitializing(false);
        }
      };
      
      initializeUser();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate, fetchUserData, ensureUserDocument, isInitializing]);

  const createWishlist = async () => {
    if (!user) return;
    try {
      const newWishlistKey = ID.unique();
      const newWishlist = await databases.createDocument(
        databaseId,
        wishlistsCollectionId,
        ID.unique(),
        {
          teacher_name: user.name,
          teacher_id: user.$id,
          wishlist_key: newWishlistKey,
          wishlist_name: `${user.name}'s New wiSHlist`
        }
      );
      setWishlists(prev => [...prev, newWishlist as Models.Document & WishlistDoc]);
    } catch (error) {
    }
  };
  
  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/wishlist/${key}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleEditClick = (wishlist: Models.Document & WishlistDoc) => {
    setEditingWishlistId(wishlist.$id);
    setNewWishlistName(wishlist.wishlist_name || '');
  };

  const handleCancelEdit = () => {
    setEditingWishlistId(null);
    setNewWishlistName('');
  };

  const handleUpdateWishlistName = async (wishlistId: string) => {
    try {
      const updatedWishlist = await databases.updateDocument(
        databaseId,
        wishlistsCollectionId,
        wishlistId,
        { wishlist_name: newWishlistName }
      );
      setWishlists(prev => prev.map(w => w.$id === wishlistId ? updatedWishlist as Models.Document & WishlistDoc : w));
      handleCancelEdit();
    } catch (error) {
    }
  };

  const handleDeleteWishlist = (wishlistId: string) => {
    setWishlistToDelete(wishlistId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!wishlistToDelete) return;
    try {
      const items = await databases.listDocuments(databaseId, itemsCollectionId, [Query.equal('wishlist_id', wishlistToDelete)]);
      for (const item of items.documents) {
        await databases.deleteDocument(databaseId, itemsCollectionId, item.$id);
      }
      
      await databases.deleteDocument(databaseId, wishlistsCollectionId, wishlistToDelete);
      setWishlists(prev => prev.filter(w => w.$id !== wishlistToDelete));
    } catch (error) {
    } finally {
      setIsDeleteModalOpen(false);
      setWishlistToDelete(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const reorderedWishlists = Array.from(wishlists);
    const [removed] = reorderedWishlists.splice(source.index, 1);
    reorderedWishlists.splice(destination.index, 0, removed);

    setWishlists(reorderedWishlists);
    // Here you would typically update the order in your database
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
        <Header title="Dashboard" showInfoButton={true} isLoading={true} />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {rateLimited ? (
            <div className="text-center py-16">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 max-w-md mx-auto">
                <p className="text-lg mb-2">⏳ Rate limited by server</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Waiting before retry... Please be patient.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Skeleton for dashboard content */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
              <div className="text-center text-gray-600 dark:text-gray-400">
                Loading your wishlists...
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // If no userDoc but we have a user, show a message but continue
  if (!userDoc) {
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header title="Teacher Dashboard" showSettingsButton={true} showInfoButton={true} isLoading={false} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Your wiSHlists</h2>
          <button onClick={createWishlist} className="bg-green-600 text-white py-2 px-8 xs:px-4 rounded-lg hover:bg-green-800 flex items-center">
            <Plus className="w-5 h-5 xs:mr-2" />
            <span className="hidden xs:inline">Create New wiSHlist</span>
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          {enabled && (
            <Droppable droppableId="wishlists">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {wishlists.map((wishlist, index) => (
                    <Draggable key={wishlist.$id} draggableId={wishlist.$id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 cursor-pointer transition-colors duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 group"
                        >
                          <div className="flex items-center">
                          <div {...provided.dragHandleProps} className="p-2 cursor-grab">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-grow flex justify-between items-center ml-2">
                            {editingWishlistId === wishlist.$id ? (
                              <div className="flex-grow flex items-center space-x-2 mr-2">
                                <input 
                                  type="text"
                                  value={newWishlistName}
                                  onChange={(e) => setNewWishlistName(e.target.value)}
                                  className="flex-grow p-1 border rounded bg-white dark:bg-neutral-700 w-full"
                                />
                                <button onClick={() => handleUpdateWishlistName(wishlist.$id)} className="p-2 text-green-600 hover:bg-green-800 rounded-full"><Check /></button>
                                <button onClick={handleCancelEdit} className="p-2 text-red-600 hover:bg-red-800 rounded-full"><X /></button>
                              </div>
                            ) : (
                              <div 
                                className="flex-grow flex items-center space-x-2 cursor-pointer"
                                onClick={() => {
                                  navigate(`/wishlist/${wishlist.$id}/edit`);
                                }}
                              >
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-200">{wishlist.wishlist_name}</h3>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(wishlist); }}
                                  className="p-1 text-gray-500 hover:text-sky-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleCopy(wishlist.wishlist_key); }} 
                                className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${
                                  copiedKey === wishlist.wishlist_key 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-transparent text-sky-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 xs:bg-sky-600 xs:text-white xs:hover:bg-sky-800'
                                }`}
                              >
                                {copiedKey === wishlist.wishlist_key ? <Check className="w-4 h-4 xs:mr-1" /> : <Share2 className="w-4 h-4 xs:mr-1" />}
                                <span className="hidden xs:inline">{copiedKey === wishlist.wishlist_key ? 'Copied!' : 'Share List'}</span>
                              </button>
                              <Tooltip text="Duplicate wiSHlist" position="top">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      // Simple duplicate naming - just append (copy) each time
                                      const originalName = wishlist.wishlist_name || wishlist.wishlist_key;
                                      const newName = `${originalName}(copy)`;
                                      
                                      // Generate a new unique key for the duplicate
                                      const newKey = `${wishlist.wishlist_key.replace(/[^a-zA-Z0-9]/g, '')}-copy-${Math.random().toString(36).substring(2, 8)}`;
                                      
                                      // Remove all keys starting with '$' from the wishlist object
                                      const filtered = Object.fromEntries(
                                        Object.entries(wishlist).filter(([key]) => !key.startsWith('$') && key !== 'wishlist_key' && key !== 'wishlist_name')
                                      );
                                      
                                      await databases.createDocument(
                                        databaseId,
                                        wishlistsCollectionId,
                                        ID.unique(),
                                        {
                                          ...filtered,
                                          wishlist_key: newKey,
                                          wishlist_name: newName,
                                          teacher_id: user?.$id,
                                          teacher_name: user?.name
                                        }
                                      );

                                      // Duplicate all items from the original wishlist to the new wishlist
                                      // Use 'wishlist_id' for the query, as 'wishlist_key' is not in the items schema
                                      const itemsResponse = await databases.listDocuments(
                                        databaseId,
                                        itemsCollectionId,
                                        [Query.equal('wishlist_id', wishlist.$id)]
                                      );
                                      for (const item of itemsResponse.documents) {
                                        // Remove all keys starting with '$' and 'wishlist_key' from the item object
                                        const itemFiltered = Object.fromEntries(
                                          Object.entries(item).filter(([key]) => !key.startsWith('$') && key !== 'wishlist_id' && key !== 'wishlist_key')
                                        );
                                        await databases.createDocument(
                                          databaseId,
                                          itemsCollectionId,
                                          ID.unique(),
                                          {
                                            ...itemFiltered,
                                            wishlist_id: newKey
                                          }
                                        );
                                      }

                                      // Refresh wishlists
                                      const response = await databases.listDocuments(
                                        databaseId,
                                        wishlistsCollectionId,
                                        [Query.equal('teacher_id', user?.$id)]
                                      );
                                      setWishlists(response.documents as (Models.Document & WishlistDoc)[]);
                                    } catch (err) {
                                      alert('Failed to duplicate wishlist.');
                                    }
                                  }}
                                  className="p-2 text-sky-600 hover:bg-neutral-800 dark:hover:bg-neutral-800 rounded-full"
                                >
                                  <Copy className="w-5 h-5" />
                                </button>
                              </Tooltip>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteWishlist(wishlist.$id); }}
                                className="p-2 text-red-600 hover:bg-white dark:hover:bg-neutral-800 rounded-full"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </DragDropContext>
        
        {/* Empty State for New Users */}
        {wishlists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to wiSHlist! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first wishlist to get started. Your students and supporters will be able to see and fulfill your classroom needs.
              </p>
            </div>
          </div>
        )}
      </main>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Wishlist"
      >
        <p>Are you sure you want to delete this wishlist and all of its items? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};
