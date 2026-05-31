import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, CheckCircle2, Ticket, Mail, Info, Copy } from 'lucide-react';
import { Coupon } from '../types';
import confetti from 'canvas-confetti';
import { googleSignIn, initAuth, getAccessToken } from '../lib/auth';
import { sendReceiptEmail } from '../lib/gmail';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, token, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [sendReceipt, setSendReceipt] = useState(false);
  const [googleAuthenticated, setGoogleAuthenticated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Manual Payment'>('Cash on Delivery');
  const [transactionId, setTransactionId] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    initAuth((_, token) => {
      setGoogleAuthenticated(true);
    }, () => {
      setGoogleAuthenticated(false);
    });
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const data = await api.get(`/coupons/validate/${couponCode}`);
      setAppliedCoupon(data);
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01759231313');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const [form, setForm] = useState({
    fullName: user?.name || '',
    address: '',
    phone: '',
    email: user?.email || '',
    instructions: ''
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.applicableProductIds?.length > 0) {
      const applicableTotal = cart.reduce((acc, item) => {
        if (appliedCoupon.applicableProductIds.includes(item.product.id)) {
          return acc + (item.product.discountPrice || item.product.price) * item.quantity;
        }
        return acc;
      }, 0);
      discountAmount = applicableTotal * (appliedCoupon.discountPercentage / 100);
    } else {
      discountAmount = subtotal * (appliedCoupon.discountPercentage / 100);
    }
  }

  const shipping = (subtotal - discountAmount) > 1000 ? 0 : 50; 
  const total = subtotal - discountAmount + shipping;

  const handleGoogleAuthForReceipt = async () => {
    try {
      await googleSignIn();
      setGoogleAuthenticated(true);
      setSendReceipt(true);
    } catch (err: any) {
      const isCancelError = err.code === 'auth/popup-closed-by-user' || 
                            err.code === 'auth/cancelled-popup-request' ||
                            err.code === 'auth/user-cancelled';
      if (!isCancelError) {
        console.error(err);
      }
      setSendReceipt(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        items: cart.map(i => ({ productId: i.product.id, title: i.product.title, price: i.product.price, quantity: i.quantity })),
        totalAmount: total,
        couponCode: appliedCoupon?.code,
        discountAmount: discountAmount,
        deliveryDetails: form,
        paymentMethod,
        transactionId: paymentMethod === 'Manual Payment' ? transactionId : undefined
      }, token);
      
      if (sendReceipt && googleAuthenticated && form.email) {
        try {
          await sendReceiptEmail(res.id || 'ORDER-' + Date.now().toString(36).toUpperCase(), total, cart.length, form.email);
        } catch (emailErr) {
          console.error('Failed to send receipt email', emailErr);
          // Let checkout succeed even if email fails
        }
      }

      setSuccess(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#22d3ee', '#10b981', '#f43f5e', '#eab308']
      });
      clearCart();
    } catch (err) {
      alert("Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Order Placed Successfully!</h1>
        <p className="text-slate-600 mb-8">Your order has been received and will be processed soon. You chose Cash on Delivery.</p>
        <Link to="/" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">Looks like you haven't added any components yet. Get started by exploring our catalog or building your dream custom rig.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/builder" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-300 hover:shadow-indigo-500/25">
            Start PC Builder
          </Link>
          <Link to="/products" className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-200 text-base font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-300">
            Browse Featured
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <Link to="/" className="hover:bg-slate-200 p-2 rounded-full transition-colors mr-2">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Shopping Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div 
                key={item.product.id} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4"
              >
                <div className="w-24 h-24 bg-slate-50 rounded border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
                  <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 line-clamp-2">{item.product.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.product.discountPrice ? (
                      <>
                        <span className="text-rose-600 font-medium">৳{item.product.discountPrice.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 line-through">৳{item.product.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-indigo-600 font-medium">৳{item.product.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-slate-200 rounded">
                    <button 
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="px-3 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                    >-</button>
                    <span className="px-3 py-1 text-sm font-medium border-x border-slate-200">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-3 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                    >+</button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-rose-500 hover:bg-rose-50 p-2 rounded transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Checkout Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="Coupon code" 
                  value={couponCode} 
                  onChange={e => setCouponCode(e.target.value)}
                  disabled={appliedCoupon !== null}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none disabled:bg-slate-100"
                />
                {!appliedCoupon ? (
                  <button onClick={handleApplyCoupon} disabled={couponLoading} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                    Apply
                  </button>
                ) : (
                  <button onClick={removeCoupon} className="bg-rose-100 text-rose-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-200">
                    Remove
                  </button>
                )}
              </div>
              {couponError && <p className="text-rose-500 text-xs font-medium">{couponError}</p>}
              {appliedCoupon && <p className="text-emerald-600 text-xs font-medium flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Coupon applied successfully!</p>}
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.length} items)</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-৳{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `৳${shipping.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2">Delivery Details</h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Address</label>
                <textarea required rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Additional Delivery Instructions <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea rows={2} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="e.g., Leave at the front door, Call before delivery" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email (for receipt)</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>

              <div className="flex items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="sendReceipt"
                  className="mt-1 accent-indigo-600"
                  checked={sendReceipt}
                  onChange={(e) => {
                    if (e.target.checked && !googleAuthenticated) {
                      handleGoogleAuthForReceipt();
                    } else {
                      setSendReceipt(e.target.checked);
                    }
                  }}
                />
                <label htmlFor="sendReceipt" className="ml-2 text-sm text-slate-700 cursor-pointer">
                  Send email receipt with Gmail
                  {!googleAuthenticated && <span className="block text-xs text-slate-500 mt-0.5">Requires "Sign in with Google"</span>}
                  {googleAuthenticated && <span className="block text-xs text-emerald-600 mt-0.5 font-medium">Google Account linked</span>}
                </label>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2 pt-2">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`block p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'Cash on Delivery' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <div className="flex items-center space-x-2">
                      <input type="radio" className="accent-indigo-600 flex-shrink-0" name="paymentType" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={() => setPaymentMethod('Cash on Delivery')} />
                      <span className="font-medium text-sm text-slate-900">Cash on Delivery</span>
                    </div>
                  </label>
                  <label className={`block p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'Manual Payment' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <div className="flex items-center space-x-2">
                      <input type="radio" className="accent-indigo-600 flex-shrink-0" name="paymentType" value="Manual Payment" checked={paymentMethod === 'Manual Payment'} onChange={() => setPaymentMethod('Manual Payment')} />
                      <span className="font-medium text-sm text-slate-900 leading-tight">Manual Payment <br className="sm:hidden"/><span className="text-xs text-slate-500 font-normal sm:ml-1">(bKash, Nagad, Rocket)</span></span>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'Manual Payment' && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-4">
                  <div className="text-sm text-orange-900">
                    <div className="font-semibold mb-2 lg:text-base">
                      Please send the total amount to our bKash/Nagad Personal Number: 
                      <div className="inline-flex items-center gap-2 bg-white px-2 py-1 rounded border border-orange-200 shadow-sm ml-2 align-middle">
                        <strong className="text-indigo-600 tracking-wider">01759231313</strong>
                        <button type="button" onClick={handleCopyPhone} className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none" title="Copy Phone Number">
                          {copiedPhone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-orange-800">Enter your Transaction ID below to verify your payment.</p>
                    <div className="flex items-start gap-2 bg-orange-100/70 border border-orange-200/80 p-3 rounded-lg mt-3">
                      <Info className="w-5 h-5 flex-shrink-0 text-orange-600 mt-0.5" />
                      <p className="text-xs sm:text-sm font-medium text-orange-900 leading-relaxed">
                        Note: After sending the money, your payment will be verified within a maximum of 12 hours.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-900 mb-1">Transaction ID (TrxID) <span className="text-rose-500">*</span></label>
                    <input 
                      required={paymentMethod === 'Manual Payment'} 
                      type="text" 
                      value={transactionId} 
                      onChange={e => setTransactionId(e.target.value)} 
                      placeholder="e.g. TFQ8Q2WXV"
                      className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white placeholder-orange-300/50" 
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-70 mt-4 shadow-md shadow-indigo-600/20"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  );
}
