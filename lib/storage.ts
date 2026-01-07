
import { Booking } from '../types';

const WISHLIST_KEY = 'omah_turu_wishlist';
const BOOKINGS_KEY = 'omah_turu_bookings';
const ONBOARDING_KEY = 'omah_turu_has_onboarded';
const USERS_KEY = 'omah_turu_users';
const CURRENT_USER_KEY = 'omah_turu_current_user';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text passwords
  avatar?: string;
  phone?: string;
}

// --- Wishlist ---
export const getWishlist = (): string[] => {
  const stored = localStorage.getItem(WISHLIST_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const toggleWishlist = (villaId: string): string[] => {
  const current = getWishlist();
  const exists = current.includes(villaId);
  const updated = exists 
    ? current.filter(id => id !== villaId) 
    : [...current, villaId];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  return updated;
};

// --- Bookings ---
export const getBookings = (): Booking[] => {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  let bookings: Booking[] = stored ? JSON.parse(stored) : [];

  // Lazy Expiration Check: Update 'pending' bookings that have passed their deadline
  const now = Date.now();
  let hasChanges = false;

  bookings = bookings.map(b => {
    if (b.status === 'pending' && now > b.paymentDeadline) {
      hasChanges = true;
      return { ...b, status: 'expired' };
    }
    return b;
  });

  if (hasChanges) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  }

  return bookings;
};

export const saveBooking = (booking: Omit<Booking, 'id' | 'timestamp' | 'status' | 'paymentDeadline'>): Booking => {
  const now = Date.now();
  // Set deadline to 24 hours from now
  const deadline = now + (24 * 60 * 60 * 1000); 
  
  const newBooking: Booking = {
    ...booking,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: now,
    status: 'pending',
    paymentDeadline: deadline,
  };
  
  // We use getBookings() first to ensure we don't overwrite any auto-expired updates
  const current = getBookings();
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify([newBooking, ...current]));
  return newBooking;
};

export const cancelBooking = (bookingId: string): void => {
  const current = getBookings();
  const updated = current.map(b => 
    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
  );
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
};

export const confirmPayment = (bookingId: string): void => {
  const current = getBookings();
  const updated = current.map(b => 
    b.id === bookingId ? { ...b, status: 'paid' as const } : b
  );
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
};

// --- Onboarding ---
export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
};

export const completeOnboarding = (): void => {
  localStorage.setItem(ONBOARDING_KEY, 'true');
};

// --- Authentication ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const signUp = (data: Omit<User, 'id' | 'avatar'>): User => {
  const users = getUsers();
  
  // Simple check if email exists
  if (users.find(u => u.email === data.email)) {
    throw new Error('Email already exists');
  }

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    avatar: `https://i.pravatar.cc/150?u=${data.email}`,
    ...data
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser)); // Auto login
  return newUser;
};

export const signIn = (email: string, password: string): User => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const updateCurrentUser = (data: Partial<User>): User => {
  const current = getCurrentUser();
  if (!current) throw new Error("No user logged in");

  const updatedUser = { ...current, ...data };
  
  // Update in session
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

  // Update in DB
  const users = getUsers();
  const updatedUsers = users.map(u => u.id === current.id ? updatedUser : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

  return updatedUser;
};

export const signOut = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
  // We do NOT remove onboarding key, as they have already seen it
};
