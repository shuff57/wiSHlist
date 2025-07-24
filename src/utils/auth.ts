export const generateRegistrationToken = (expiryHours: string): string => {
  const token = Math.random().toString(36).substring(2, 15);
  return `https://classroom-wishlist.com/register?token=${token}&expires=${expiryHours}h`;
};
