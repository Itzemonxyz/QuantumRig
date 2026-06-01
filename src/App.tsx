import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from './store';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
import { api } from './lib/api';
import Layout from './components/Layout';
// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Builder from './pages/Builder';
import LaptopFinder from './pages/LaptopFinder';
import Cart from './pages/Cart';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import TrackOrder from './pages/TrackOrder';
import Offers from './pages/Offers';

export default function App() {
  const { setCategories, setBrands, setProducts, setOffers, setSettings, setSocialLinks, token, login, logout, setIsLoading } = useStore();

  useEffect(() => {
    // Initial fetch
    const boot = async () => {
      try {
        const [cats, brnds, prods, ofrs, sets, slinks] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
          api.get('/products'),
          api.get('/offers'),
          api.get('/settings'),
          api.get('/social-links')
        ]);
        
        setCategories(cats || []);
        setBrands(brnds || []);
        setProducts(prods || []);
        setOffers(ofrs || []);
        setSettings(sets || null);
        setSocialLinks(slinks || []);
        
        // Also fetch user if token exists
        if (token) {
          try {
            const u = await api.get('/users/me', token);
            if (u) login(u as any, token);
          } catch (e: any) {
             if (e.message !== "Unauthorized") {
               console.error("User fetch failed", e);
             }
             logout();
          }
        }
      } catch (err) {
        console.error("Failed to boot app catalog", err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [setCategories, setBrands, setProducts, setOffers, setSettings, login, logout, setIsLoading]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="builder" element={<Builder />} />
          <Route path="laptop-finder" element={<LaptopFinder />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="admin-login" element={<AdminLogin />} />
          <Route path="profile" element={<Profile />} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="offers" element={<Offers />} />
          <Route path="admin/*" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
