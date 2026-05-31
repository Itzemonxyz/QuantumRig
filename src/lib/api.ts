import { auth, db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, 
  query, where, serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import type { 
  User, Category, Brand, Product, Order, Settings, 
  Coupon, Offer, RestockRequest, SupportTicket 
} from '../types';

export const api = {
  get: async (endpoint: string, token?: string | null) => {
    // Users Auth
    if (endpoint === '/users/me') {
      if (!auth.currentUser) throw new Error("Not logged in");
      const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!d.exists()) {
        const newUser = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
          email: auth.currentUser.email || '',
          role: auth.currentUser.email === 'itzemon990@gmail.com' ? 'admin' : 'user',
          savedProductIds: []
        };
        await setDoc(doc(db, 'users', auth.currentUser.uid), newUser);
        return newUser;
      }
      return d.data();
    }
    if (endpoint === '/users/me/notifications') {
      if (!auth.currentUser) return [];
      const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return d.data()?.notifications || [];
    }

    // Collections
    if (endpoint === '/categories') {
      const snap = await getDocs(collection(db, 'categories'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint === '/brands') {
      const snap = await getDocs(collection(db, 'brands'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint === '/products') {
      const snap = await getDocs(collection(db, 'products'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint.startsWith('/products/')) {
      const id = endpoint.split('/')[2];
      const d = await getDoc(doc(db, 'products', id));
      if (!d.exists()) throw new Error("Not found");
      return { id: d.id, ...d.data() };
    }
    if (endpoint === '/offers') {
      const snap = await getDocs(collection(db, 'offers'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint === '/coupons') {
      const snap = await getDocs(collection(db, 'coupons'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint.startsWith('/coupons/validate/')) {
      const code = endpoint.split('/')[3].toLowerCase();
      const snap = await getDocs(query(collection(db, 'coupons'), where("code", "==", code), where("isActive", "==", true)));
      if (snap.empty) throw new Error("Invalid or inactive coupon");
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    if (endpoint === '/settings') {
      const d = await getDoc(doc(db, 'settings', 'global'));
      return d.exists() ? d.data() : {
        announcementText: "", facebookUrl: "", whatsappUrl: "", instagramUrl: ""
      };
    }
    if (endpoint === '/orders') {
      const snap = await getDocs(collection(db, 'orders'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint === '/orders/user') {
      if (!auth.currentUser) return [];
      const snap = await getDocs(query(collection(db, 'orders'), where("userId", "==", auth.currentUser.uid)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint.startsWith('/public/orders/')) {
      const id = endpoint.split('/')[3];
      const d = await getDoc(doc(db, 'orders', id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    }
    if (endpoint === '/admin/restock-requests') {
      const snap = await getDocs(collection(db, 'restockRequests'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint === '/support-tickets') {
      const snap = await getDocs(collection(db, 'supportTickets'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    if (endpoint === '/admin/analytics') {
      const [orderSnap, userSnap, productSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'products'))
      ]);
      const orders = orderSnap.docs.map(d => d.data() as Order);
      const activeOrders = orders.filter(o => o.status !== 'Cancelled');
      
      const orderBreakdown = {
        Pending: orders.filter(o => o.status === 'Pending').length,
        Verified: orders.filter(o => o.status === 'Accepted').length, 
        Delivered: orders.filter(o => o.status === 'Delivered').length,
        Shipped: orders.filter(o => o.status === 'Shipped').length
      };

      const topProducts: {title: string, count: number}[] = [];
      const salesData: {name: string, revenue: number}[] = [];

      return {
        totalRevenue: activeOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalOrders: orders.length,
        totalUsers: userSnap.size,
        totalProducts: productSnap.size,
        orderBreakdown,
        topProducts,
        salesData: []
      };
    }
    throw new Error(`GET Endpoint ${endpoint} not implemented in Firebase mapping`);
  },

  post: async (endpoint: string, data: any, token?: string | null) => {
    if (endpoint === '/auth/login') {
      const creds = await signInWithEmailAndPassword(auth, data.email, data.password);
      const userDoc = await getDoc(doc(db, 'users', creds.user.uid));
      return { token: creds.user.uid, user: userDoc.data() };
    }
    if (endpoint === '/auth/register') {
      const creds = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const isAdmin = data.email === 'itzemon990@gmail.com';
      const newUser = { id: creds.user.uid, name: data.name, email: data.email, role: isAdmin ? 'admin' : 'user', savedProductIds: [] };
      await setDoc(doc(db, 'users', creds.user.uid), newUser);
      return { token: creds.user.uid, user: newUser };
    }
    
    if (endpoint === '/users/me/saved-products') {
      if (!auth.currentUser) throw new Error("Unauthorized");
      const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const u = d.data() as User;
      const ids = u.savedProductIds || [];
      if (!ids.includes(data.productId)) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { savedProductIds: [...ids, data.productId] });
      }
      return { ...u, savedProductIds: [...ids, data.productId] };
    }
    if (endpoint.startsWith('/products/') && endpoint.endsWith('/reviews')) {
      const id = endpoint.split('/')[2];
      const revId = 'rev_' + Date.now();
      const rev = { ...data, id: revId, createdAt: new Date().toISOString() };
      return rev; 
    }
    
    // Generics for arrays
    const simpleCollections = ['categories', 'brands', 'products', 'offers', 'coupons', 'support-tickets', 'orders'];
    for (const c of simpleCollections) {
      if (endpoint === `/${c}`) {
        const collName = c === 'support-tickets' ? 'supportTickets' : c;
        const newRef = doc(collection(db, collName));
        const finalData = { id: newRef.id, ...data, createdAt: new Date().toISOString() };
        await setDoc(newRef, finalData);
        return finalData;
      }
    }
    
    if (endpoint === '/restock-requests') {
      const ref = doc(collection(db, 'restockRequests'));
      const finalData = { id: ref.id, ...data, createdAt: new Date().toISOString(), status: 'pending' };
      await setDoc(ref, finalData);
      return finalData;
    }

    if (endpoint === '/notify-stock' || endpoint === '/analytics/track') {
      return { success: true };
    }
    
    throw new Error(`POST Endpoint ${endpoint} not implemented in Firebase mapping`);
  },

  put: async (endpoint: string, data: any, token?: string | null) => {
    if (endpoint === '/settings') {
      await setDoc(doc(db, 'settings', 'global'), data);
      return data;
    }

    if (endpoint.startsWith('/orders/') && endpoint.endsWith('/status')) {
      const id = endpoint.split('/')[2];
      await updateDoc(doc(db, 'orders', id), { status: data.status });
      return { id, ...data };
    }
    if (endpoint.startsWith('/orders/') && endpoint.endsWith('/paymentStatus')) {
      const id = endpoint.split('/')[2];
      await updateDoc(doc(db, 'orders', id), { paymentStatus: data.paymentStatus });
      return { id, ...data };
    }
    if (endpoint.startsWith('/users/me/notifications/') && endpoint.endsWith('/read')) {
      // Stub
      return { success: true };
    }

    const match = endpoint.match(/^\/([^/]+)\/([^/]+)$/);
    if (match) {
      const coll = match[1] === 'support-tickets' ? 'supportTickets' : match[1];
      const id = match[2];
      await updateDoc(doc(db, coll, id), data);
      return { id, ...data };
    }

    throw new Error(`PUT Endpoint ${endpoint} not implemented in Firebase mapping`);
  },

  delete: async (endpoint: string, token?: string | null): Promise<any> => {
    if (endpoint.startsWith('/users/me/saved-products/')) {
      if (!auth.currentUser) throw new Error("Unauthorized");
      const id = endpoint.split('/')[4];
      const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const u = d.data() as User;
      const ids = (u.savedProductIds || []).filter(pid => pid !== id);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { savedProductIds: ids });
      return { ...u, savedProductIds: ids };
    }

    const match = endpoint.match(/^\/([^/]+)\/([^/]+)$/);
    if (match) {
      const coll = match[1];
      const id = match[2];
      await deleteDoc(doc(db, coll, id));
      return;
    }

    throw new Error(`DELETE Endpoint ${endpoint} not implemented in Firebase mapping`);
  }
};
