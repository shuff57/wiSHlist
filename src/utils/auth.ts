import { User, LoginForm } from '../types';
import { DEMO_CREDENTIALS } from '../constants';

export const validateLogin = (loginForm: LoginForm): User | null => {
  const validUser = DEMO_CREDENTIALS.find(
    cred => cred.email === loginForm.email && cred.password === loginForm.password
  );
  
  if (validUser) {
    return {
      name: validUser.name,
      email: validUser.email,
      role: validUser.role as 'admin' | 'supporter'
    };
  }
  
  return null;
};

export const generateRegistrationToken = (expiryHours: string): string => {
  const token = Math.random().toString(36).substring(2, 15);
  return `https://classroom-wishlist.com/register?token=${token}&expires=${expiryHours}h`;
};
