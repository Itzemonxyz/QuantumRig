import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../lib/api';
import { useStore } from '../store';

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
      redirect: 'if_required',
    });

    if (error) {
      addToast(error.message || 'Payment failed', 'error');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else if (
      paymentIntent &&
      (paymentIntent.status === 'requires_action' || paymentIntent.status === 'processing')
    ) {
      onSuccess(paymentIntent.id);
    } else {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          disabled={!stripe || loading}
          type="submit"
          className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-70 transition-colors shadow-md shadow-indigo-600/20 text-sm"
        >
          {loading ? 'Processing Payment...' : `Pay \u09F3${total.toLocaleString('en-IN')}`}
        </button>
      </div>
    </form>
  );
}

export default function StripeCheckout({ total, onSuccess, onCancel, token }: any) {
  const [clientSecret, setClientSecret] = useState('');
  const [initError, setInitError] = useState('');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (!token) return;
    setInitError('');

    let isMounted = true;

    Promise.all([
      api.get('/stripe-config', token),
      api.post('/create-payment-intent', { amount: total }, token),
    ])
      .then(([config, intent]) => {
        if (!isMounted) return;
        if (!config?.publicKey) {
           setInitError("Missing Stripe Public Key from server configuration.");
           return;
        }
        if (!intent?.clientSecret) {
           setInitError("Failed to initialize payment intent client secret.");
           return;
        }
        setStripePromise(loadStripe(config.publicKey));
        setClientSecret(intent.clientSecret);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Stripe Initialisation error:", err);
        const errorMsg =
          err?.response?.data?.error || err.message || 'Payment gateway initialization failed';
        setInitError(errorMsg);
      });

    return () => {
      isMounted = false;
    };
  }, [total, token]);

  if (initError) {
    return (
      <div className="p-6 text-center border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-xl my-4">
        <p className="text-sm text-rose-600 dark:text-rose-400 font-bold mb-3">
          Payment Gateway Error
        </p>
        <div className="text-xs bg-rose-100 dark:bg-rose-900/40 px-3 py-2 rounded-lg text-rose-800 dark:text-rose-300 font-mono inline-block mb-4 text-left">
          {initError}
        </div>
        <p className="text-xs text-rose-500 font-medium mb-5">
          Please ensure Stripe API keys (STRIPE_SECRET_KEY) are configured in your deployment environment settings.
        </p>
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500 flex flex-col justify-center items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Connecting to secure server...</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <PaymentForm total={total} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
