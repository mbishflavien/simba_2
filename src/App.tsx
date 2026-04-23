import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './hooks/useCart';
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
        <Router>
          <ScrollToTop />
          <AppLayout />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const isAdmin = profile?.isAdmin;
  const isAdminPage = pathname === '/admin';

  // Admin users should only see the focused admin dashboard
  const hideGlobalUI = isAdmin || isAdminPage;

  return (
    <div className="flex flex-col min-h-screen">
      {!hideGlobalUI && <Navbar />}
      <div className={cn("flex-grow", isAdmin && !isAdminPage && "flex items-center justify-center")}>
        {isAdmin && !isAdminPage ? (
          <div className="text-center p-12">
            <h2 className="massive-header opacity-20 uppercase italic mb-8">ADMIN ACCESS</h2>
            <p className="micro-label !opacity-60 mb-12">YOU ARE CURRENTLY LOGGED IN AS AN ADMINISTRATOR.</p>
            <Link 
              to="/admin" 
              className="px-12 py-6 bg-brand-primary text-white rounded-[32px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl inline-block"
            >
              GO TO ADMIN DASHBOARD
            </Link>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
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
        )}
      </div>
      {!hideGlobalUI && <Footer />}
    </div>
  );
}
