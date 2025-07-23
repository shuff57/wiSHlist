export interface User {
  name: string;
  email: string;
  role: 'admin' | 'supporter';
}

export interface WishlistItem {
  id: number;
  name: string;
  description: string;
  storeLink: string;
  cost: string;
  contributions: number;
}

export interface CustomRequest {
  id: number;
  itemName: string;
  description: string;
  storeLink: string;
  estimatedCost: string;
  status: 'pending' | 'approved' | 'declined';
  requestedBy: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistrationForm {
  name: string;
  email: string;
  password: string;
}

export interface CustomWishForm {
  itemName: string;
  description: string;
  storeLink: string;
  estimatedCost: string;
}

export interface AdminForm {
  itemName: string;
  description: string;
  storeLink: string;
  cost: string;
}
