import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../lib/api';
import { useStore } from '../store';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

function PaymentForm({ onSuccess, total, onCancel }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { addToast } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!stripe || !elements) return;
     setLoading(true);
     
     const { error, paymentIntent } = await stripe.confirmPayment({
       elements,
       confirmParams: {
         return_url: window.location.origin + '/checkout?success=true',
       },
       redirect: 'if_required' 
     });
     
     if (error) {
       addToast(error.message || 'Payment failed', 'error');
       setLoading(false);
     } else if (paymentIntent && paymentIntent.status === 'succeeded') {
       onSuccess(paymentIntent.id);
     } else if (paymentIntent && (paymentIntent.status === 'requires_action' || paymentIntent.status === 'processing')) {
       // Typically handled by redirect, but if not
       onSuccess(paymentIntent.id); 
     } else {
       setLoading(false);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
         <PaymentElement options={{layout: 'tabs'}} />
       </div>
       <div className="flex gap-3 pt-2">
         <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors text-sm">Cancel</button>
         <button disabled={!stripe || loading} type="submit" className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-70 transition-colors shadow-md shadow-indigo-600/20 text-sm">
            {loading ? 'Processing Payment...' : `Pay \u09F3${total.toLocaleString("en-IN")}`}
         </button>
       </div>
    </form>
  )
}

export default function StripeCheckout({ total, onSuccess, onCancel, token }: any) {
  const [clientSecret, setClientSecret] = useState('');
  const { addToast } = useStore();

  useEffect(() => {
    if (!token) return;
    api.post('/create-payment-intent', { amount: total }, token)
       .then(res => setClientSecret(res.clientSecret))
       .catch(err => {
         console.error(err);
         addToast("Payment gateway initialization failed", 'error');
       });
  }, [total, token, addToast]);

  if (!clientSecret) return <div className="p-4 text-center text-sm font-bold text-slate-500 flex justify-center items-center gap-2">
    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    Loading Secure Payment Gateway...
  </div>;

  return (
    <div className="animate-in fade-in duration-200">
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
         <PaymentForm total={total} onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  )
}
