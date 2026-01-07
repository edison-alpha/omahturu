
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './components/layout/BottomNav';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Details } from './pages/Details';
import { Profile } from './pages/Profile';
import { Wishlist } from './pages/Wishlist';
import { Bookings } from './pages/Bookings';
import { BookingDetail } from './pages/BookingDetail';
import { Payment } from './pages/Payment';
import { SeeAll } from './pages/SeeAll';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { getCurrentUser } from './lib/storage';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen w-full"
    >
      {children}
    </motion.div>
  );
};

const EntryPoint = () => {
  const user = getCurrentUser();

  // If user is logged in, go straight to Home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  // If not logged in, ALWAYS start at Onboarding (The "Landing Page")
  // This enforces the flow: Onboarding -> Sign In
  return <Onboarding />;
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><EntryPoint /></PageTransition>} />
        <Route path="/signin" element={<PageTransition><SignIn /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        
        {/* Protected Routes */}
        <Route path="/home" element={<PageTransition><ProtectedRoute><Home /></ProtectedRoute></PageTransition>} />
        <Route path="/villa/:id" element={<PageTransition><ProtectedRoute><Details /></ProtectedRoute></PageTransition>} />
        <Route path="/booking/:id" element={<PageTransition><ProtectedRoute><BookingDetail /></ProtectedRoute></PageTransition>} />
        <Route path="/payment/:id" element={<PageTransition><ProtectedRoute><Payment /></ProtectedRoute></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><ProtectedRoute><Wishlist /></ProtectedRoute></PageTransition>} />
        <Route path="/bookings" element={<PageTransition><ProtectedRoute><Bookings /></ProtectedRoute></PageTransition>} />
        <Route path="/see-all/:type" element={<PageTransition><ProtectedRoute><SeeAll /></ProtectedRoute></PageTransition>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <HashRouter>
      <div className="max-w-md mx-auto min-h-screen bg-stone-50 relative shadow-2xl overflow-x-hidden font-sans">
        <AnimatedRoutes />
        <BottomNav />
      </div>
    </HashRouter>
  );
};

export default App;
