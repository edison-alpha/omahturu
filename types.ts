
export interface Facility {
  icon: string;
  name: string;
}

export interface Review {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
}

export interface Villa {
  id: string;
  name: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  price: number;
  rating: number;
  reviews: number;
  description: string;
  images: string[];
  facilities: Facility[];
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  bookingPolicy?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

export interface Booking {
  id: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  timestamp: number;
  status: BookingStatus;
  paymentDeadline: number; // Timestamp for 24h deadline
}
