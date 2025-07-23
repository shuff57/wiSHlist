import React, { useState } from 'react';
import { LoginView } from '../components/auth/LoginView';
import { WishlistView } from '../components/wishlist/WishlistView';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { User, LoginForm, CustomWishForm, AdminForm, WishlistItem, CustomRequest } from '../types';
import { validateLogin, generateRegistrationToken } from '../utils/auth';
import { INITIAL_WISHLIST_ITEMS, INITIAL_CUSTOM_REQUESTS } from '../constants';

const TeacherWishlist: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'wishlist' | 'admin'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [customWishForm, setCustomWishForm] = useState<CustomWishForm>({ 
    itemName: '', 
    description: '', 
    storeLink: '', 
    estimatedCost: '' 
  });
  const [adminForm, setAdminForm] = useState<AdminForm>({ 
    itemName: '', 
    description: '', 
    storeLink: '', 
    cost: '' 
  });
  const [registrationLink, setRegistrationLink] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(INITIAL_WISHLIST_ITEMS);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>(INITIAL_CUSTOM_REQUESTS);
  const [teacherName, setTeacherName] = useState("Ms. Johnson");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const validUser = validateLogin(loginForm);
    if (validUser) {
      setUser(validUser);
      setCurrentView(validUser.role === 'admin' ? 'admin' : 'wishlist');
    } else {
      setLoginError('Either the email or password is wrong.');
    }
  };

  const handleGoogleLogin = () => {
    const userData: User = {
      name: 'Google User',
      email: 'user@gmail.com',
      role: 'supporter'
    };
    setUser(userData);
    setCurrentView('wishlist');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  const handleLoginFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomWishFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomWishForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const submitCustomWish = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: CustomRequest = {
      id: customRequests.length + 1,
      ...customWishForm,
      status: 'pending',
      requestedBy: user?.name || 'Anonymous'
    };
    setCustomRequests([...customRequests, newRequest]);
    setCustomWishForm({ itemName: '', description: '', storeLink: '', estimatedCost: '' });
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

  const markContribution = (itemId: number) => {
    setWishlistItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, contributions: item.contributions + 1 }
          : item
      )
    );
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

  const generateLink = () => {
    const link = generateRegistrationToken(linkExpiry);
    setRegistrationLink(link);
  };

  if (!user) {
    return (
      <LoginView
        loginForm={loginForm}
        showPassword={showPassword}
        loginError={loginError}
        onLogin={handleLogin}
        onLoginFormChange={handleLoginFormChange}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  if (user.role === 'admin' && currentView === 'admin') {
    return (
      <AdminDashboard
        user={user}
        adminForm={adminForm}
        linkExpiry={linkExpiry}
        registrationLink={registrationLink}
        customRequests={customRequests}
        onAdminFormChange={handleAdminFormChange}
        onAddNewItem={addNewItem}
        onLinkExpiryChange={(e) => setLinkExpiry(e.target.value)}
        onGenerateLink={generateLink}
        onCopyLink={() => navigator.clipboard.writeText(registrationLink)}
        onApproveRequest={approveCustomRequest}
        onDeclineRequest={(id) => setCustomRequests(reqs => reqs.filter(r => r.id !== id))}
        onViewWishlist={() => setCurrentView('wishlist')}
        onLogout={handleLogout}
        onUpdateName={(newName) => setTeacherName(newName)}
      />
    );
  }

  return (
    <WishlistView
      user={user}
      items={wishlistItems}
      teacherName={teacherName}
      onLogout={handleLogout}
      onAdminView={() => setCurrentView('admin')}
      onMarkContribution={markContribution}
      customWishForm={customWishForm}
      onCustomWishFormChange={handleCustomWishFormChange}
      onSubmitCustomWish={submitCustomWish}
      onUpdateTeacherName={(newName) => setTeacherName(newName)}
    />
  );
};

export default TeacherWishlist;
