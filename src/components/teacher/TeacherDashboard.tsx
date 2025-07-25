import React, { useState, useEffect, useCallback } from 'react';
import { databases, databaseId, wishlistsCollectionId, usersCollectionId, itemsCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Plus, Check, Share2, Pencil, Trash2, X, GripVertical } from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
  const [userDoc, setUserDoc] = useState<Models.Document & UserDoc | null>(null);
  const [wishlists, setWishlists] = useState<(Models.Document & WishlistDoc)[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingWishlistId, setEditingWishlistId] = useState<string | null>(null);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [wishlistToDelete, setWishlistToDelete] = useState<string | null>(null);
  const [enabled] = useStrictDroppable(loading || authLoading);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async (userId: string, userName: string, userEmail: string) => {
    let doc = null;
    try {
        doc = await databases.getDocument(databaseId, usersCollectionId, userId);
    } catch (e: any) {
        if (e.code === 404) {
            try {
                doc = await databases.createDocument(
                    databaseId, usersCollectionId, userId,
                    { name: userName, email: userEmail, role: 'teacher', isRecommender: false, isAdmin: false }
                );
            } catch (createError: any) {
                if (createError.code === 409) {
                    try {
                        await new Promise(res => setTimeout(res, 250));
                        doc = await databases.getDocument(databaseId, usersCollectionId, userId);
                    } catch (refetchError) {
                        console.error("Failed to refetch user document after race condition:", refetchError);
                    }
                } else {
                    console.error("Failed to create user document:", createError);
                }
            }
        } else {
            console.error("Failed to get user document:", e);
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
            console.error("Failed to fetch wishlists:", error);
        }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserData(user.$id, user.name, user.email).finally(() => setLoading(false));
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate, fetchUserData]);

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
          wishlist_name: `${user.name}'s New Wishlist`
        }
      );
      setWishlists(prev => [...prev, newWishlist as Models.Document & WishlistDoc]);
    } catch (error) {
      console.error("Error creating wishlist:", error);
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
      console.error("Error updating wishlist name:", error);
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
      console.error("Error deleting wishlist:", error);
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

  if (authLoading || loading || !user || !userDoc) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header title="Teacher Dashboard" showSettingsButton={true} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Your wiSHlists</h2>
          <button onClick={createWishlist} className="bg-lime-700 text-white py-2 px-4 rounded-lg hover:bg-lime-800 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New wiSHlist
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
                          className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 transition-transform duration-200 hover:scale-[1.02] group"
                        >
                          <div className="flex items-center">
                            <div {...provided.dragHandleProps} className="p-2 cursor-grab">
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-grow flex justify-between items-center ml-2">
                              {editingWishlistId === wishlist.$id ? (
                                <div className="flex-grow flex items-center space-x-2">
                                  <input 
                                    type="text"
                                    value={newWishlistName}
                                    onChange={(e) => setNewWishlistName(e.target.value)}
                                    className="flex-grow p-1 border rounded bg-white dark:bg-neutral-700"
                                  />
                                  <button onClick={() => handleUpdateWishlistName(wishlist.$id)} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Check /></button>
                                  <button onClick={handleCancelEdit} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><X /></button>
                                </div>
                              ) : (
                                <div 
                                  className="flex-grow flex items-center space-x-2 cursor-pointer"
                                  onClick={() => navigate(`/wishlist/${wishlist.$id}/edit`)}
                                >
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-200">{wishlist.wishlist_name}</h3>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(wishlist); }}
                                    className="p-1 text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleCopy(wishlist.wishlist_key); }} 
                                  className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${copiedKey === wishlist.wishlist_key ? 'bg-lime-700 text-white' : 'bg-sky-700 text-white hover:bg-sky-800'}`}
                                >
                                  {copiedKey === wishlist.wishlist_key ? <Check className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
                                  {copiedKey === wishlist.wishlist_key ? 'Copied!' : 'Share List'}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteWishlist(wishlist.$id); }}
                                  className="p-2 text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full"
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
