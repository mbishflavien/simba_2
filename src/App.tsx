import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './hooks/useCart';
import { WishlistProvider } from './hooks/useWishlist';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { cn } from './lib/utils';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { ContactSupport, DeliveryTC, MoMoGuide } from './pages/SupportInfo';
import './i18n';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <AppLayout />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const isAdmin = profile?.isAdmin;
  const isAdminPage = pathname === '/admin';

  // Admin pages should have a focused UI, but admins can still browse the shop
  const hideGlobalUI = isAdminPage;

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full relative">
      {!hideGlobalUI && <Navbar />}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/support/contact" element={<ContactSupport />} />
          <Route path="/support/delivery" element={<DeliveryTC />} />
          <Route path="/support/momo-guide" element={<MoMoGuide />} />
        </Routes>
      </div>
      {!hideGlobalUI && <Footer />}
    </div>
  );
}
