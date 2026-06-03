import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { ShoppingCart, ArrowLeft, Check, AlertTriangle, Heart, Share2, CheckCircle2, ChevronDown, ChevronUp, HelpCircle, X, Scale, Zap, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { products, categories, addToCart, user, token, updateUser, compareIds, toggleCompare, addToast } = useStore();

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="text-indigo-600 hover:underline">
          Return to Products
        </button>
      </div>
    );
  }

  const category = categories.find(c => c.id === product.categoryId);
  const isOutOfStock = product.stockStatus === 'Out of Stock' || product.inventoryCount === 0;
  const isLowStock = !isOutOfStock && product.inventoryCount !== undefined && product.inventoryCount < 5;
  const stockTrend = product.inventoryCount !== undefined ? (product.inventoryCount < 10 ? 'depleting' : 'replenishing') : 'unknown';

  const isSaved = user?.savedProductIds?.includes(product.id) || false;
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showQuickBuyModal, setShowQuickBuyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSupportToast, setShowSupportToast] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [supportQuestion, setSupportQuestion] = useState('');
  const [supportErrors, setSupportErrors] = useState<{ email?: string; question?: string }>({});

  const allImages = [product.imageUrl, ...(product.additionalImages || [])];
  const [activeImage, setActiveImage] = useState(product.imageUrl);

  const [zoomStyle, setZoomStyle] = useState({});
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  // Reviews
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Set activeImage back when product changes
  React.useEffect(() => {
    setActiveImage(product.imageUrl);
  }, [product.id, product.imageUrl]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReview(true);
    try {
      await api.post(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      }, token);
      
      // Update local product reviews (Assuming server returns updated product or just fetching new list)
      // Usually would refresh entire store products, here we just do a quick fetch
      const p = await api.get(`/products/${product.id}`);
      useStore.getState().setProducts(useStore.getState().products.map(pr => pr.id === p.id ? p : pr));
      
      setReviewComment('');
    } catch(err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };
  const [quantity, setQuantity] = useState(1);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [isQuickBuying, setIsQuickBuying] = useState(false);

  const handleSupportSubmit = async () => {
    const errors: { email?: string; question?: string } = {};
    if (!supportEmail) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      errors.email = 'Invalid email format';
    }
    
    if (!supportQuestion.trim()) {
      errors.question = 'Question is required';
    }

    if (Object.keys(errors).length > 0) {
      setSupportErrors(errors);
      return;
    }

    try {
      await api.post('/support-tickets', { productId: product.id, email: supportEmail, question: supportQuestion });
      setSupportErrors({});
      setSupportEmail('');
      setSupportQuestion('');
      setShowSupportModal(false);
      setShowSupportToast(true);
      setTimeout(() => setShowSupportToast(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotifyStock = async () => {
    if (!user) {
      alert("Please log in to be notified when this product is restocked.");
      return;
    }
    try {
      await api.post('/restock-requests', { productId: product.id }, token);
      setNotifySuccess(true);
      setTimeout(() => setNotifySuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert("Error requesting notification");
    }
  };

  const handleShare = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSave = async () => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    try {
      if (isSaved) {
        const res = await api.delete(`/users/me/saved-products/${product.id}`, token);
        updateUser(res);
        addToast(`Removed "${product.title}" from your wishlist.`, 'info');
      } else {
        const res = await api.post('/users/me/saved-products', { productId: product.id }, token);
        updateUser(res);
        addToast(`Added "${product.title}" to your wishlist!`, 'success');
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      addToast('Failed to update wishlist.', 'error');
    }
  };

  const breadcrumbItems = [
    { label: 'Products', path: '/products' },
    { label: category?.name || 'Category', path: `/products?category=${category?.id || ''}` },
    { label: product.title }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-900">
      <Breadcrumbs items={breadcrumbItems} />
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          <div 
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bg-white border border-slate-200 rounded-2xl p-8 flex items-center justify-center min-h-[400px] relative overflow-hidden group cursor-crosshair"
          >
            <img 
              src={activeImage} 
              alt={product.title} 
              className="w-full max-w-md h-auto object-contain mix-blend-multiply transition-transform duration-75 ease-out"
              style={zoomStyle}
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 bg-white border ${activeImage === img ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'} rounded-xl cursor-pointer p-2 flex items-center justify-center flex-shrink-0 transition-all`}
                >
                  <img src={img} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              {category?.name || 'Accessories'}
            </div>
            {product.brand && (
              <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                {product.brand}
              </div>
            )}
            {product.code && (
              <div className="text-xs sm:text-xs font-medium text-slate-600 bg-indigo-50 border border-indigo-100/50 rounded-full px-3 py-1 flex items-center shadow-sm select-none">
                Product Code:&nbsp;<strong className="font-bold text-slate-900">{product.code}</strong>
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button 
              onClick={handleSave} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                isSaved ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 border-slate-200'
              }`}
            >
              <Heart className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
              {isSaved ? "Saved" : "Save"}
            </button>
            
            <button 
              onClick={() => toggleCompare(product.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                compareIds?.includes(product.id) ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 border-slate-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              {compareIds?.includes(product.id) ? "Comparing" : "Compare"}
            </button>

            <button 
              onClick={handleShare} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? "Copied!" : "Share"}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {product.discountPrice ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-rose-600">৳{Number(product.discountPrice || 0).toFixed(0)}</span>
                <span className="text-xl font-medium text-slate-400 line-through">৳{Number(product.price || 0).toFixed(0)}</span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-indigo-600">৳{Number(product.price || 0).toFixed(0)}</span>
            )}
            {isOutOfStock ? (
              <span className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-sm font-bold flex items-center border border-rose-200">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Out of Stock
              </span>
            ) : stockTrend === 'depleting' ? (
              <span className="px-3 py-1 bg-amber-50 text-amber-500 rounded-full text-sm font-bold flex items-center border border-amber-200">
                <TrendingDown className="w-4 h-4 mr-1" />
                Only {product.inventoryCount} Left
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-500 rounded-full text-sm font-bold flex items-center border border-emerald-200">
                <TrendingUp className="w-4 h-4 mr-1" />
                In Stock
              </span>
            )}
          </div>

          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="product-details-actions flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
            {isOutOfStock ? (
              <div className="flex flex-col items-center gap-4 w-full">
                {user ? (
                  <button
                    onClick={handleNotifyStock}
                    disabled={notifySuccess}
                    className="flex w-full items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-500 disabled:text-white disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 flex-shrink-0 shadow-lg h-14"
                  >
                    {notifySuccess ? <Check className="w-6 h-6 mr-2" /> : <Bell className="w-6 h-6 mr-2" />}
                    {notifySuccess ? 'Notification Request Sent!' : 'Notify me when available'}
                  </button>
                ) : (
                  <Link to="/login" className="flex w-full items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg transition-all h-14 text-center">
                    Log in to be notified for restock
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden h-14 bg-white shrink-0 justify-between">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors h-full flex items-center justify-center font-bold text-xl w-16 sm:w-auto"
                  >
                    -
                  </button>
                  <div className="w-12 text-center font-bold text-slate-900 border-x-2 border-slate-200 flex items-center justify-center h-full flex-1 sm:flex-none">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-4 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors h-full flex items-center justify-center font-bold text-xl w-16 sm:w-auto"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    if (!token) {
                      navigate('/login', { state: { from: location } });
                      return;
                    }
                    setIsAdded(true);
                    addToCart(product, quantity);
                    setTimeout(() => setIsAdded(false), 800);
                  }}
                  className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-all transform flex-1 min-w-[200px] h-14 relative overflow-hidden ${isAdded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white shadow-lg shadow-indigo-600/20'}`}
                >
                  {isAdded ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center">
                      <CheckCircle2 className="w-6 h-6 mr-3" />
                      Added to Cart!
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6 mr-3" />
                      Add to Cart
                    </>
                  )}
                </button>

                <div className="w-full relative flex flex-col items-center">
                  <motion.button
                    animate={isQuickBuying ? {} : { 
                      boxShadow: ["0px 0px 0px 0px rgba(245,158,11,0.1)", "0px 0px 8px 3px rgba(245,158,11,0.5)", "0px 0px 0px 0px rgba(245,158,11,0.1)"]
                    }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                    whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.5), 0 8px 10px -6px rgba(245, 158, 11, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsQuickBuying(true);
                      api.post('/analytics/track', { event: 'quick_buy', productId: product.id })
                        .catch(console.error)
                        .finally(() => {
                          setIsQuickBuying(false);
                          setShowQuickBuyModal(true);
                        });
                    }}
                    disabled={isQuickBuying}
                    className={`relative flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all w-full h-14 ${isQuickBuying ? 'opacity-75 cursor-not-allowed shadow-none' : 'shadow-lg'}`}
                  >
                    {isQuickBuying ? (
                      <div className="w-5 h-5 mr-3 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    ) : (
                      <Zap className="w-6 h-6 mr-3" />
                    )}
                    {isQuickBuying ? 'Loading...' : 'Quick Buy'}
                    {(product.inventoryCount !== undefined && product.inventoryCount >= 1 && product.inventoryCount <= 5) && (
                      <motion.span 
                        animate={{ opacity: [1, 0.5, 1] }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-3 -right-2 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap"
                      >
                        Limited stock remaining
                      </motion.span>
                    )}
                  </motion.button>
                  <p className="text-xs text-slate-500 mt-3 text-center sm:text-left flex items-center justify-center sm:justify-start w-full">
                    <Zap className="w-3 h-3 inline mr-1 text-amber-500" /> Quick Buy securely checks out with one click
                  </p>
                </div>
              </>
            )}

            <div className="w-full mt-2 flex justify-center sm:justify-start">
              <Link 
                to={`/products?category=${product.categoryId}`} 
                className="text-slate-500 hover:text-indigo-600 font-medium transition-colors text-sm hover:underline underline-offset-4"
              >
                View full category
              </Link>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="mt-12 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 mb-4">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {(() => {
                const specElements = [];
                if (product.socket) {
                  specElements.push(
                    <div key="socket" className="flex justify-between border-b border-slate-200 py-2.5 px-2 md:hover:bg-white md:hover:shadow-sm md:hover:translate-x-1 transition-all duration-200 rounded-md">
                      <span className="text-slate-500 font-medium tracking-wide text-sm">Socket</span>
                      <span className="text-slate-900 font-semibold">{product.socket}</span>
                    </div>
                  );
                }
                if (product.wattage !== undefined && product.wattage > 0) {
                  specElements.push(
                    <div key="wattage" className="flex justify-between border-b border-slate-200 py-2.5 px-2 md:hover:bg-white md:hover:shadow-sm md:hover:translate-x-1 transition-all duration-200 rounded-md">
                      <span className="text-slate-500 font-medium tracking-wide text-sm">Wattage</span>
                      <span className="text-slate-900 font-semibold">{product.wattage}W</span>
                    </div>
                  );
                }
                Object.entries(product.specs || {}).forEach(([key, value]) => {
                  specElements.push(
                    <div key={key} className="flex justify-between border-b border-slate-200 py-2.5 px-2 md:hover:bg-white md:hover:shadow-sm md:hover:translate-x-1 transition-all duration-200 rounded-md">
                      <span className="text-slate-500 font-medium tracking-wide text-sm">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-slate-900 font-semibold text-right">{value as string}</span>
                    </div>
                  );
                });

                const SPECS_LIMIT = 4;
                const visibleSpecs = showAllSpecs ? specElements : specElements.slice(0, SPECS_LIMIT);
                const hasMoreSpecs = specElements.length > SPECS_LIMIT;

                return (
                  <>
                    {visibleSpecs}
                    {hasMoreSpecs && (
                      <div className="sm:col-span-2 flex justify-center mt-2">
                        <button 
                          onClick={() => setShowAllSpecs(!showAllSpecs)}
                          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors py-2 px-4 rounded-md hover:bg-indigo-50"
                        >
                          {showAllSpecs ? (
                            <>View Less <ChevronUp className="w-4 h-4 ml-1" /></>
                          ) : (
                            <>View More <ChevronDown className="w-4 h-4 ml-1" /></>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Ask an Expert Banner */}
      <div className="mt-12 bg-indigo-50 rounded-2xl p-8 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Have questions about this product?</h3>
          <p className="text-slate-600">Our PC builder experts are ready to help you ensure perfectly compatible parts.</p>
        </div>
        <button
          onClick={() => setShowSupportModal(true)}
          className="flex items-center justify-center bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all shrink-0"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          Ask an Expert
        </button>
      </div>

      {/* Similar Products */}
      <div className="mt-16 border-t border-slate-200 pt-16 mb-12">
        <h3 className="text-2xl font-bold text-slate-900 mb-8">Similar Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products
            .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
            .slice(0, 4)
            .map(p => (
            <div key={p.id} onClick={() => { setActiveImage(p.imageUrl); navigate(`/products/${p.id}`); window.scrollTo(0,0); }} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
              <div className="aspect-square bg-slate-50 rounded-xl mb-4 p-4 flex items-center justify-center overflow-hidden">
                <img src={p.imageUrl} alt={p.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-indigo-600 mb-1">{p.brand || 'Premium'}</div>
                <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{p.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-slate-900">৳{p.discountPrice ? Number(p.discountPrice || 0).toFixed(2) : Number(p.price || 0).toFixed(2)}</span>
                  {p.discountPrice && <span className="text-xs text-slate-400 line-through">৳{Number(p.price || 0).toFixed(2)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-slate-200 mb-12">
        <h3 className="text-2xl font-bold text-slate-900 mb-8">Customer Reviews</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {(!product.reviews || product.reviews.length === 0) ? (
              <p className="text-slate-500 italic">No reviews yet. Be the first to review this product!</p>
            ) : (
              product.reviews.map(review => (
                <div key={review.id} className="border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">{review.userName}</span>
                    <span className="text-sm text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-amber-400 mb-3 flex">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                </div>
              ))
            )}
          </div>
          
          <div>
            {user ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Write a Review</h4>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <select 
                      value={reviewRating} 
                      onChange={e => setReviewRating(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Your Review</label>
                    <textarea
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="What did you think about this product?"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                <h4 className="font-bold text-slate-900 mb-2">Write a Review</h4>
                <p className="text-slate-500 text-sm mb-4">You must be logged in to review products.</p>
                <Link to="/login" className="inline-block bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition">
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollToTopButton />

      <AnimatePresence>
        {showQuickBuyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Quick Purchase</h3>
                <button onClick={() => setShowQuickBuyModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-4 items-center mb-6 border-b border-slate-100 pb-6">
                <img src={product.imageUrl} className="w-20 h-20 object-contain mix-blend-multiply bg-slate-50 rounded-lg p-2" />
                <div>
                  <h4 className="font-bold text-slate-900">{product.title}</h4>
                  <p className="text-slate-500 text-sm">Qty: {quantity}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">৳{Number(((product.discountPrice || product.price) * quantity) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-600">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span>৳{Number(((product.discountPrice || product.price) * quantity) || 0).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!token) {
                    setShowQuickBuyModal(false);
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  addToCart(product, quantity);
                  setShowQuickBuyModal(false);
                  navigate('/cart');
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              >
                Proceed to Checkout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center">
                   <HelpCircle className="w-5 h-5 mr-2 text-indigo-600" />
                   Ask an Expert
                 </h2>
                 <button 
                   onClick={() => setShowSupportModal(false)}
                   className="text-slate-400 hover:text-slate-900 p-2"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-4 text-sm">Have complex hardware questions about the <strong>{product.title}</strong>? Our PC building experts are here to help.</p>
                <div className="mb-4">
                  <input 
                    type="email"
                    placeholder="Your Email"
                    value={supportEmail}
                    onChange={(e) => {
                      setSupportEmail(e.target.value);
                      if (supportErrors.email) setSupportErrors({ ...supportErrors, email: '' });
                    }}
                    className={`w-full border ${supportErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-indigo-500'} rounded-lg p-3 text-sm focus:ring-2 focus:outline-none`}
                  />
                  {supportErrors.email && <p className="text-rose-500 text-xs mt-1">{supportErrors.email}</p>}
                </div>
                <div className="mb-4">
                  <textarea 
                    rows={4}
                    placeholder="Type your question here..."
                    value={supportQuestion}
                    onChange={(e) => {
                      setSupportQuestion(e.target.value);
                      if (supportErrors.question) setSupportErrors({ ...supportErrors, question: '' });
                    }}
                    className={`w-full border ${supportErrors.question ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-indigo-500'} rounded-lg p-3 text-sm focus:ring-2 focus:outline-none`}
                  ></textarea>
                  {supportErrors.question && <p className="text-rose-500 text-xs mt-1">{supportErrors.question}</p>}
                </div>
                <button 
                  onClick={handleSupportSubmit}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  Send Question
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupportToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-3 font-medium"
          >
            <CheckCircle2 className="w-5 h-5" />
            Support ticket has been queued!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
