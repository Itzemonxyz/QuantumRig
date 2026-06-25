import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import ProductSkeleton from '../components/ProductSkeleton';
import ProductCard from '../components/ProductCard';
import RecentlyViewed from '../components/RecentlyViewed';
import AnnouncementBar from '../components/AnnouncementBar';
import { useScrollLock } from '../hooks/useScrollLock';
import { api } from '../lib/api';
import { 
  Cpu, 
  CircuitBoard, 
  MemoryStick, 
  HardDrive, 
  Gpu, 
  PlugZap, 
  PcCase, 
  Fan, 
  Monitor, 
  Gamepad2, 
  Box,
  LayoutGrid,
  Search,
  LifeBuoy,
  ArrowRight,
  Zap,
  Headphones,
  Laptop,
  Flame,
  ShieldCheck,
  Award,
  Sparkles,
  Star,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

export default function Home() {
  const { categories, products, isLoading, user, addToast, offers, banners, settings, faqs } = useStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMoreMobileCats, setShowMoreMobileCats] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const activeBanners = banners?.filter(b => b.active) || [];
  
  // 1. Filter rotating main banners
  const mainBanners = activeBanners.filter(b => !b.type || b.type === 'main');
  const defaultMainBanners = [
    {
      id: "def_banner_1",
      title: "Dream PC Build Highlight",
      imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1400&q=80",
      description: "Ultimate Neon Rig Setup",
      active: true,
      linkUrl: "/builder",
      type: "main" as const
    },
    {
      id: "def_banner_2",
      title: "Next-Gen Thermal Challenge",
      imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1400&q=80",
      description: "Extreme Performance Assemblies",
      active: true,
      linkUrl: "/products",
      type: "main" as const
    }
  ];

  const displayedBanners = mainBanners.length > 0 ? mainBanners : defaultMainBanners;

  // 2. Fixed top right banner ("fixed-1")
  const fixed1FromDb = activeBanners.find(b => b.type === 'fixed-1');
  const fixed1Banner = fixed1FromDb || {
    id: "def_fixed_1",
    title: "Gaming Peripherals Collection",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    description: "Star Perks App Promotion",
    active: true,
    linkUrl: "/products?category=accessories",
    type: "fixed-1" as const
  };

  // 3. Fixed bottom right banner ("fixed-2")
  const fixed2FromDb = activeBanners.find(b => b.type === 'fixed-2');
  const fixed2Banner = fixed2FromDb || {
    id: "def_fixed_2",
    title: "Next-Gen Processor Architecture",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    description: "AC Calculator Upgrade",
    active: true,
    linkUrl: "/products?category=processors",
    type: "fixed-2" as const
  };

  const [campaignIndex, setCampaignIndex] = useState(0);

  useEffect(() => {
    if (displayedBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCampaignIndex(prev => (prev + 1) % displayedBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayedBanners.length]);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCampaignIndex(prev => (prev + 1) % displayedBanners.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCampaignIndex(prev => (prev - 1 + displayedBanners.length) % displayedBanners.length);
  };

  // Complaints states
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(0);
  
  useScrollLock(isComplaintOpen);

  const [complaintName, setComplaintName] = useState('');
  const [complaintEmail, setComplaintEmail] = useState('');
  const [complaintOrderId, setComplaintOrderId] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('Delivery Issue');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Pre-fill complainant details when modal opens
  useEffect(() => {
    if (isComplaintOpen && user) {
      setComplaintName(user.name || '');
      setComplaintEmail(user.email || '');
    }
  }, [isComplaintOpen, user]);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintName.trim() || !complaintEmail.trim() || !complaintDescription.trim()) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    setIsSubmittingComplaint(true);
    try {
      await api.post('/complaints', {
        name: complaintName,
        email: complaintEmail,
        orderId: complaintOrderId,
        category: complaintCategory,
        description: complaintDescription
      });
      addToast('Your complaint has been submitted successfully to the admin team.', 'success');
      setComplaintDescription('');
      setComplaintOrderId('');
      setIsComplaintOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to submit complaint', 'error');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim() 
    ? products.filter(p => 
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) // limit to 5 results
    : [];

  const getCategoryIcon = (category: any) => {
    const slug = (category?.slug || '').toLowerCase();
    const id = (category?.id || '').toLowerCase();
    const name = (category?.name || '').toLowerCase();
    
    if (slug.includes('processor') || id === 'c1' || name.includes('processor') || name.includes('cpu')) return <Cpu className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('motherboard') || id === 'c2' || name.includes('motherboard')) return <CircuitBoard className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('ram') || id === 'c3' || name.includes('ram') || name.includes('memory')) return <MemoryStick className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('storage') || id === 'c4' || name.includes('storage') || name.includes('ssd') || name.includes('hdd')) return <HardDrive className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('graphic') || slug.includes('gpu') || id === 'c5' || name.includes('gpu') || name.includes('graphic')) return <Gpu className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('power') || slug.includes('psu') || id === 'c6' || name.includes('power') || name.includes('psu')) return <PlugZap className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('case') || slug.includes('casing') || id === 'c7' || name.includes('case') || name.includes('chassis')) return <PcCase className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('cooler') || id === 'c8' || name.includes('cooler')) return <Fan className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('monitor') || id === 'c9' || name.includes('monitor') || name.includes('display')) return <Monitor className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('laptop') || id === 'c11' || name.includes('laptop')) return <Laptop className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('accessor') || id === 'c10' || name.includes('accessor') || name.includes('mouse') || name.includes('keyboard')) return <Gamepad2 className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    
    return <Box className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
  };

  const getCategoryMeta = (category: any) => {
    const slug = (category?.slug || '').toLowerCase();
    const id = (category?.id || '').toLowerCase();
    const name = (category?.name || '').toLowerCase();
    
    if (slug.includes('processor') || id === 'c1' || name.includes('processor') || name.includes('cpu')) {
      return {
        icon: <Cpu className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "COMPUTE ENGINE",
        bgColor: "rgba(79, 70, 229, 0.08)",
        textColor: "#4f46e5",
        accentColor: "#4f46e5",
        glowColor: "rgba(79, 70, 229, 0.15)",
        countDescription: "High-Performance Cores",
        iconClass: "text-indigo-600 dark:text-indigo-400"
      };
    }
    if (slug.includes('motherboard') || id === 'c2' || name.includes('motherboard')) {
      return {
        icon: <CircuitBoard className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "CENTRAL FLUX",
        bgColor: "rgba(139, 92, 246, 0.08)",
        textColor: "#8b5cf6",
        accentColor: "#8b5cf6",
        glowColor: "rgba(139, 92, 246, 0.15)",
        countDescription: "Stable System Architecture",
        iconClass: "text-violet-600 dark:text-violet-400"
      };
    }
    if (slug.includes('ram') || id === 'c3' || name.includes('ram') || name.includes('memory')) {
      return {
        icon: <MemoryStick className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "XMP FAST RAM",
        bgColor: "rgba(20, 184, 166, 0.08)",
        textColor: "#14b8a6",
        accentColor: "#14b8a6",
        glowColor: "rgba(20, 184, 166, 0.15)",
        countDescription: "High MHz DDR5 Modules",
        iconClass: "text-teal-600 dark:text-teal-400"
      };
    }
    if (slug.includes('storage') || id === 'c4' || name.includes('storage') || name.includes('ssd') || name.includes('hdd')) {
      return {
        icon: <HardDrive className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "GEN4 NVME SSD",
        bgColor: "rgba(16, 185, 129, 0.08)",
        textColor: "#10b981",
        accentColor: "#10b981",
        glowColor: "rgba(16, 185, 129, 0.15)",
        countDescription: "Extreme Read/Write Speeds",
        iconClass: "text-emerald-600 dark:text-emerald-400"
      };
    }
    if (slug.includes('graphic') || slug.includes('gpu') || id === 'c5' || name.includes('gpu') || name.includes('graphic')) {
      return {
        icon: <Gpu className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "RAY-TRACING CORE",
        bgColor: "rgba(244, 63, 94, 0.08)",
        textColor: "#f43f5e",
        accentColor: "#f43f5e",
        glowColor: "rgba(244, 63, 94, 0.15)",
        countDescription: "Unmatched FPS & Rendering",
        iconClass: "text-rose-600 dark:text-rose-400"
      };
    }
    if (slug.includes('power') || slug.includes('psu') || id === 'c6' || name.includes('power') || name.includes('psu')) {
      return {
        icon: <PlugZap className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "GOLD CERTIFIED",
        bgColor: "rgba(245, 158, 11, 0.08)",
        textColor: "#f59e0b",
        accentColor: "#f59e0b",
        glowColor: "rgba(245, 158, 11, 0.15)",
        countDescription: "Stable Energy Delivery",
        iconClass: "text-amber-600 dark:text-amber-400"
      };
    }
    if (slug.includes('case') || slug.includes('casing') || id === 'c7' || name.includes('case') || name.includes('chassis')) {
      return {
        icon: <PcCase className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "AIRFLOW SHELL",
        bgColor: "rgba(59, 130, 246, 0.08)",
        textColor: "#3b82f6",
        accentColor: "#3b82f6",
        glowColor: "rgba(59, 130, 246, 0.15)",
        countDescription: "Optimal Structural Layout",
        iconClass: "text-blue-600 dark:text-blue-400"
      };
    }
    if (slug.includes('cooler') || id === 'c8' || name.includes('cooler')) {
      return {
        icon: <Fan className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "THERMAL CONTROL",
        bgColor: "rgba(6, 182, 212, 0.08)",
        textColor: "#06b6d4",
        accentColor: "#06b6d4",
        glowColor: "rgba(6, 182, 212, 0.15)",
        countDescription: "Low Decibel Fluid Fans",
        iconClass: "text-cyan-600 dark:text-cyan-400"
      };
    }
    if (slug.includes('monitor') || id === 'c9' || name.includes('monitor') || name.includes('display')) {
      return {
        icon: <Monitor className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "ULTRA HIGH REFRESH",
        bgColor: "rgba(168, 85, 247, 0.08)",
        textColor: "#a855f7",
        accentColor: "#a855f7",
        glowColor: "rgba(168, 85, 247, 0.15)",
        countDescription: "Vibrant Gaming Panels",
        iconClass: "text-purple-600 dark:text-purple-400"
      };
    }
    if (slug.includes('laptop') || id === 'c11' || name.includes('laptop')) {
      return {
        icon: <Laptop className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "PORTABLE POWER",
        bgColor: "rgba(217, 70, 239, 0.08)",
        textColor: "#d946ef",
        accentColor: "#d946ef",
        glowColor: "rgba(217, 70, 239, 0.15)",
        countDescription: "All-In-One Specifications",
        iconClass: "text-fuchsia-600 dark:text-fuchsia-400"
      };
    }
    if (slug.includes('accessor') || id === 'c10' || name.includes('accessor') || name.includes('mouse') || name.includes('keyboard')) {
      return {
        icon: <Gamepad2 className="w-5 h-5" strokeWidth={1.5} />,
        tagline: "TACTILE CONTROL",
        bgColor: "rgba(249, 115, 22, 0.08)",
        textColor: "#f97316",
        accentColor: "#f97316",
        glowColor: "rgba(249, 115, 22, 0.15)",
        countDescription: "Premium Gaming Gear",
        iconClass: "text-orange-600 dark:text-orange-400"
      };
    }

    return {
      icon: <Box className="w-5 h-5" strokeWidth={1.5} />,
      tagline: "ACCESSORY CORE",
      bgColor: "rgba(79, 70, 229, 0.08)",
      textColor: "#4f46e5",
      accentColor: "#4f46e5",
      glowColor: "rgba(79, 70, 229, 0.15)",
      countDescription: "Vetted Sourced Hardware",
      iconClass: "text-indigo-600 dark:text-indigo-400"
    };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-200px)] text-slate-900 dark:text-white w-full shadow-2xl relative pb-8">
      
      {/* Mobile-Only Blocks */}
      <div className="md:hidden flex flex-col w-full">
        {/* Quick Access Categories separate box container for mobile */}
        <div className="bg-white dark:bg-slate-900 py-5 px-4 border-b border-slate-200 dark:border-slate-800 relative z-10 mb-2 select-none" id="mobile-categories-separate-box">
          <div className="mb-4">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 block mb-0.5">HARDWARE SECTIONS</span>
            <h3 className="text-lg font-bold text-[#111827] dark:text-white">Categories</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(categories || []).slice(0, showMoreMobileCats ? (categories || []).length : 4).map((c) => {
              const meta = getCategoryMeta(c);
              if (!c) return null;
              return (
                <div 
                  key={c.id || 'fallback'} 
                  className="p-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/85 dark:border-slate-700 rounded-xl flex items-center gap-3 cursor-pointer select-none transform hover:scale-[1.01] hover:shadow-md transition-all duration-300 active:scale-95 active:bg-indigo-50/20 active:border-indigo-200 dark:active:border-indigo-500/50" 
                  onClick={() => c.id && navigate(`/products?category=${c.id}`)}
                >
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${meta.iconClass}`}
                    style={{ 
                      backgroundColor: meta.bgColor,
                      borderColor: meta.accentColor + "15",
                      /* color: meta.textColor */ 
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-[#111827] dark:text-white truncate leading-tight">{c.name || 'Category'}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">{meta.tagline.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {(categories || []).length > 4 && (
            <button 
              onClick={() => setShowMoreMobileCats(p => !p)} 
              className="w-full mt-4 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-bold text-indigo-600 flex items-center justify-center rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
            >
              {showMoreMobileCats ? 'Show Less' : 'Show All Categories'}
            </button>
          )}
        </div>

        {/* Mobile Dynamic Campaign Poster Slider */}
        <div className="px-4 mt-2">
          <div 
            id="mobile-campaign-slider-card"
            onClick={() => navigate(displayedBanners[campaignIndex]?.linkUrl || '/builder')}
            className="relative w-full overflow-hidden group cursor-pointer transition-all duration-300 transform flex items-center justify-center"
          >
            {/* Underlay Poster Image (scales naturally) */}
            <img 
              src={displayedBanners[campaignIndex]?.imageUrl} 
              alt={displayedBanners[campaignIndex]?.title} 
              className="max-w-full max-h-full w-auto h-auto object-contain block select-none pointer-events-none rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 transition-transform hover:scale-[1.01] hover:shadow-md"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute bottom-3 right-4 flex space-x-1.5 z-10 bg-black/20 px-2 py-1.5 rounded-xl backdrop-blur-sm">
              {displayedBanners.map((_, i) => (
                <button 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); setCampaignIndex(i); }}
                  className={`h-1.5 rounded-full ${i === campaignIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'} transition-all`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Fixed Banners side-by-side */}
        <div className="grid grid-cols-2 gap-3 px-4 mt-3">
          <div 
            onClick={() => navigate(fixed1Banner.linkUrl || '/builder')}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md flex items-center justify-center"
          >
            <img 
              src={fixed1Banner.imageUrl} 
              alt={fixed1Banner.title} 
              className="w-full h-auto block select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>
          <div 
            onClick={() => navigate(fixed2Banner.linkUrl || '/builder')}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md flex items-center justify-center"
          >
            <img 
              src={fixed2Banner.imageUrl} 
              alt={fixed2Banner.title} 
              className="w-full h-auto block select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Modern Detached Announcement Ticker Box */}
        <div className="mt-3 mx-4">
          <AnnouncementBar />
        </div>

        {/* Primary Action Buttons */}
        <div className="flex gap-3 px-4 py-4 mb-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm mt-3">
          <button onClick={() => navigate('/builder')} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-2 flex flex-col items-center justify-center shadow-lg shadow-indigo-600/10 transition-transform active:scale-95 border border-transparent">
            <CircuitBoard className="w-6 h-6 mb-1 text-white" />
            <span className="font-bold text-xs">PC Builder</span>
          </button>
          <button onClick={() => navigate('/laptop-finder')} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl py-3 px-2 flex flex-col items-center justify-center shadow-sm transition-transform active:scale-95 border border-indigo-200">
            <Laptop className="w-6 h-6 mb-1 text-indigo-600" />
            <span className="font-bold text-xs">Laptop Finder</span>
          </button>
        </div>
      </div>

      {/* Desktop Dynamic Campaign Poster Slider */}
      <div className="hidden md:block max-w-7xl mx-auto px-8 mt-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Main Slider (col-span-9) */}
          <div className="col-span-12 md:col-span-9 h-full">
            <div 
              id="desktop-campaign-slider-card"
              onClick={() => navigate(displayedBanners[campaignIndex]?.linkUrl || '/builder')}
              className="relative w-full h-full overflow-hidden group/slider cursor-pointer transition-all duration-305 transform flex items-center justify-center active:scale-[0.99]"
            >
              {/* Poster Image (scales naturally, border around image) */}
              <img 
                src={displayedBanners[campaignIndex]?.imageUrl} 
                alt={displayedBanners[campaignIndex]?.title} 
                className="max-w-full max-h-full w-auto h-auto object-contain block select-none pointer-events-none rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 transition-transform hover:scale-[1.01] hover:shadow-lg"
                referrerPolicy="no-referrer"
              />

              {/* Tactical Arrow Slide Controls */}
              {displayedBanners.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(e); }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 shadow-lg cursor-pointer transform hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(e); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 shadow-lg cursor-pointer transform hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Slide Pagination Markers */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-25 bg-black/20 px-3 py-2 rounded-xl backdrop-blur-sm">
                {displayedBanners.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); setCampaignIndex(i); }}
                    className={`h-2 rounded-full transition-all duration-300 ${i === campaignIndex ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Promotion Banners (col-span-3) */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
            {/* Top Fixed Promo Banner */}
            <div 
              onClick={() => navigate(fixed1Banner.linkUrl || '/builder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-305 transform hover:scale-[1.01] hover:shadow-md flex items-center justify-center active:scale-[0.99]"
            >
              <img 
                src={fixed1Banner.imageUrl} 
                alt={fixed1Banner.title} 
                className="w-full h-auto block pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom Fixed Promo Banner */}
            <div 
              onClick={() => navigate(fixed2Banner.linkUrl || '/builder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-305 transform hover:scale-[1.01] hover:shadow-md flex items-center justify-center active:scale-[0.99]"
            >
              <img 
                src={fixed2Banner.imageUrl} 
                alt={fixed2Banner.title} 
                className="w-full h-auto block pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Modern Detached Announcement Ticker Box */}
      <div className="hidden md:block max-w-7xl mx-auto px-8 mt-4 mb-6">
        <AnnouncementBar />
      </div>

      {/* Dynamic Intro Block - Immersive Custom PC Builder Banner Box in soft deep charcoal with indigo border */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-6 select-none">
        <div id="builder-hero-banner-container" className="relative w-full rounded-3xl bg-slate-900 dark:bg-slate-950/80 border border-indigo-900/50 overflow-hidden shadow-2xl p-8 md:p-14 text-center flex flex-col items-center justify-center min-h-[320px]">
          {/* Subtle background glow accents (CSS-only with no gradients in text) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.18),transparent_60%)] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            {/* Start Customizing Overline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-indigo-900/40 text-indigo-300 text-xs font-bold tracking-wider uppercase mb-5 shadow-inner">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Start Customizing
            </div>
            
            {/* Highly Highlighted Title */}
            <h1 id="home-main-heading" className="text-3xl md:text-5xl lg:text-5xl font-bold text-white tracking-tight leading-none mb-4">
              Build Your Ultimate <span id="home-main-heading-accent" className="text-indigo-400">Gaming PC</span>
            </h1>
            
            {/* Elegant Subheadline matching original description context */}
            <p className="text-sm md:text-base lg:text-lg text-indigo-200/95 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
              By Gamers, For Gamers. Discover premium PC components, expert advice, and the exact hardware you need to power your dreams.
            </p>
            
            {/* High-contrast Action Button */}
            <button
              onClick={() => navigate('/builder')}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm tracking-wide uppercase rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all duration-300 flex items-center gap-2 cursor-pointer border border-indigo-500/20"
            >
              Start Your Build <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto">


      {/* Portals Section - Relocated with beautiful graphic cards */}
      <div className="hidden md:block px-8 mt-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* PC Builder Card */}
          <Link 
            to="/builder" 
            id="portal-pc-builder"
            className="group relative overflow-hidden flex flex-col justify-between bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 dark:from-indigo-900/20 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <CircuitBoard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">PC Builder</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              Start Assembling <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Laptop Finder Card */}
          <Link 
            to="/laptop-finder" 
            id="portal-laptop-finder"
            className="group relative overflow-hidden flex flex-col justify-between bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 dark:from-blue-900/20 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Laptop Finder</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              Find Laptop <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Track Order Card */}
          <Link 
            to="/track-order" 
            id="portal-track-order"
            className="group relative overflow-hidden flex flex-col justify-between bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 dark:from-emerald-900/20 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Track Order</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              Track Progress <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Raise a Complaint Card */}
          <button 
            type="button"
            onClick={() => setIsComplaintOpen(true)}
            id="portal-raise-complaint"
            className="group relative overflow-hidden flex flex-col justify-between bg-white dark:bg-slate-900 hover:bg-rose-50/50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/50 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-100/50 dark:from-rose-900/20 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 group-hover:border-rose-200 dark:group-hover:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">Raise a Complaint</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              File Complaint <ArrowRight className="w-4 h-4" />
            </div>
          </button>

        </div>
      </div>

      {/* Complaint Submission Modal */}
      <AnimatePresence>
        {isComplaintOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComplaintOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto overflow-hidden text-left z-10 flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 px-6 py-6 text-white relative shrink-0">
                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-indigo-400 animate-pulse" />
                  File Official Complaint
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">We appreciate your feedback. Please submit details of the issue so we can inspect and resolve it.</p>
                <button 
                  type="button"
                  onClick={() => setIsComplaintOpen(false)}
                  className="absolute top-5 right-5 text-white/85 hover:text-white bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 p-1 rounded-full transition-colors font-bold w-6 h-6 flex items-center justify-center text-xs cursor-pointer z-20"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleComplaintSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Your Name *</label>
                  <input 
                    type="text" 
                    required
                    value={complaintName}
                    onChange={(e) => setComplaintName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={complaintEmail}
                    onChange={(e) => setComplaintEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      value={complaintOrderId}
                      onChange={(e) => setComplaintOrderId(e.target.value)}
                      placeholder="e.g. QRG-123456"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Category *</label>
                    <select 
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none font-medium text-slate-900 dark:text-white"
                    >
                      <option value="Delivery Issue">Delivery Issue</option>
                      <option value="Replacement / Return">Replacement / Return</option>
                      <option value="Defective Hardware">Defective Hardware</option>
                      <option value="Billing / Promo Code">Billing / Promo Code</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Other feedback">Other feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Complaint Details *</label>
                  <textarea 
                    required
                    rows={4}
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Detail what occurred. We will inspect the logged data and reply in 24 hours..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none resize-none h-28 text-slate-900 dark:text-white"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60">
                  <button 
                    type="button"
                    onClick={() => setIsComplaintOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingComplaint}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Categories Grid (Desktop) - Replaced with a visually gorgeous highlighted Categories separate box container */}
      <div className="hidden md:block px-8 mt-6 select-none" id="categories-separate-container-box">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 p-8 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-slate-50 dark:bg-slate-950 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-[10px] font-bold tracking-wider uppercase mb-2">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" /> VETTED HARDWARE CLASSIFICATION
              </div>
              <h2 className="text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                Explore Components By Category
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Select a class of hardware below to inspect technical specifications, certified benchmarks, and active inventory status.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4">
            {(categories || []).map((c) => {
              const meta = getCategoryMeta(c);
              if (!c) return null;
              return (
                <button 
                   key={c.id || 'fallback-desktop'}
                   onClick={() => c.id && navigate(`/products?category=${c.id}`)}
                   className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/80 dark:hover:border-indigo-400/50 active:scale-95 aspect-square sm:aspect-auto sm:h-32"
                >
                   {/* Icon element in highlighted colored circle badge */}
                   <div 
                     className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm border ${meta.iconClass}`}
                     style={{ 
                       backgroundColor: meta.bgColor,
                       borderColor: meta.accentColor + "20",
                     }}
                   >
                     {meta.icon}
                   </div>

                   {/* Informative description block */}
                   <div className="w-full px-1">
                     <h3 className="text-sm font-bold text-[#111827] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">
                       {c.name || 'Category'}
                     </h3>
                   </div>
                </button>
              );
            })}

            {/* All Products Action Card */}
            <button 
               onClick={() => navigate('/products')}
               className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/80 dark:hover:border-indigo-400/50 active:scale-95 aspect-square sm:aspect-auto sm:h-32"
            >
               <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm border border-indigo-100 dark:border-indigo-500/30">
                  <LayoutGrid className="w-6 h-6" strokeWidth={1.5} />
               </div>
               <div className="w-full px-1">
                 <h3 className="text-sm font-bold text-[#111827] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">
                    All Products
                 </h3>
               </div>
            </button>
          </div>
        </div>
      </div>

      {/* Trending Products */}
      <div className="px-4 md:px-8 mt-8 md:mt-20 mb-12 md:mb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 block mb-1">PROVEN COMPONENTS</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Trending Hardware</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Our most sought-after, live-in-stock gaming components.</p>
          </div>
          <Link to="/products" className="text-indigo-600 text-sm font-bold hover:text-indigo-500 flex items-center gap-1.5 transition-colors">
            View Full Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <ProductSkeleton key={`trending-skeleton-${idx}`} />
            ))
          ) : (
            products.filter(p => p.stockStatus !== 'Out of Stock').slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </div>

      {/* Curated Preset Blueprints Section */}
      <div className="px-4 md:px-8 mb-16 md:mb-24">
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-14 relative overflow-hidden shadow-sm transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md">
          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-stretch font-sans">
            
            {/* Left Console Column: Selector & Details */}
            <div className="lg:w-5/12 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-1 rounded-lg">
                  ARCHETYPE BLUEPRINTS
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight uppercase font-sans mt-3">
                  Interactive Spec Blueprints
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed font-normal">
                  Select a performance preset tailored specifically for your target output. Pre-load your selection directly into the interactive compatibility checker in one click.
                </p>
              </div>

              {/* Selector Tabs */}
              <div className="space-y-2.5">
                {[
                  { id: 0, name: "The Ray-Tracing Sentinel", cat: "S-Tier 4K Gaming", type: "Sparkles" },
                  { id: 1, name: "The E-Sports Striker", cat: "Optimized FPS sweetspot", type: "TrendingUp" },
                  { id: 2, name: "The Creator Overdrive", cat: "8K Video & AI Workstation", type: "Award" }
                ].map((tab) => {
                  const isSelected = selectedBlueprint === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedBlueprint(tab.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between font-sans ${
                        isSelected 
                          ? 'bg-white dark:bg-slate-900 border-indigo-500 text-slate-900 dark:text-white shadow-md' 
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-505 text-slate-500 dark:text-slate-400'}`}>
                          {tab.id === 0 && <Cpu className="w-4 h-4" />}
                          {tab.id === 1 && <TrendingUp className="w-4 h-4" />}
                          {tab.id === 2 && <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <strong className="text-sm block font-bold tracking-tight">{tab.name}</strong>
                          <span className="text-xs uppercase tracking-wider block text-slate-500 dark:text-slate-400 mt-0.5">{tab.cat}</span>
                        </div>
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full transition-colors ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Estimated Pricing Benchmarks */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-sans">
                <div>
                  <span className="text-xs text-slate-505 text-slate-500 dark:text-slate-400 tracking-wider block font-bold">PREPARATION CLASS</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs uppercase block mt-0.5">
                    {selectedBlueprint === 0 && "Premium Enthusiast"}
                    {selectedBlueprint === 1 && "Competitive High-FPS"}
                    {selectedBlueprint === 2 && "Heavy-Duty Compute"}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 tracking-wider block font-bold">COMPATIBILITY VETTING</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5 justify-end text-xs mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% SECURE
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive Telemetry Layout Card */}
            <div className="lg:w-7/12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative shadow-sm font-sans">
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                      {selectedBlueprint === 0 && "The Ray-Tracing Sentinel"}
                      {selectedBlueprint === 1 && "The E-Sports Striker"}
                      {selectedBlueprint === 2 && "The Creator Overdrive"}
                    </h3>
                    <p className="text-xs text-indigo-600 uppercase tracking-widest font-bold mt-1">
                      {selectedBlueprint === 0 && "Ultimate 4K Ultra-Details Presets"}
                      {selectedBlueprint === 1 && "Optimized Dynamic Latency Striker"}
                      {selectedBlueprint === 2 && "Heavy-Duty CUDA & Studio Render node"}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SPEC VERIFIED
                  </div>
                </div>

                {/* Sub Components Checklist Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    selectedBlueprint === 0 && { label: "GRAPHICS NODE", name: "NVIDIA RTX 4080 Super", icon: Gpu, sub: "16GB GDDR6X / Ray-Tracing S-Tier" },
                    selectedBlueprint === 0 && { label: "COMPUTE STACK", name: "Intel Core i9-14900K", icon: Cpu, sub: "24 Cores / 32 Threads Up to 6.0 GHz" },
                    selectedBlueprint === 0 && { label: "SYSTEM RAM", name: "32GB Trident Z5 RGB DDR5", icon: MemoryStick, sub: "6000MHz Ultra low latency" },
                    selectedBlueprint === 0 && { label: "FAST STORAGE", name: "2TB Samsung 990 Pro PCIe 4.0", icon: HardDrive, sub: "7450 MB/s Sequential Read Max" },

                    selectedBlueprint === 1 && { label: "GRAPHICS NODE", name: "AMD Radeon RX 7900 XT", icon: Gpu, sub: "20GB GDDR6 / Rasterization King" },
                    selectedBlueprint === 1 && { label: "COMPUTE STACK", name: "AMD Ryzen 7 7800X3D", icon: Cpu, sub: "8 Cores with 3D V-Cache" },
                    selectedBlueprint === 1 && { label: "SYSTEM RAM", name: "32GB Corsair Vengeance DDR5", icon: MemoryStick, sub: "5600MHz High Capacity Profile" },
                    selectedBlueprint === 1 && { label: "FAST STORAGE", name: "1TB WD Black SN850X NVMe", icon: HardDrive, sub: "7300 MB/s Extreme Performance" },

                    selectedBlueprint === 2 && { label: "GRAPHICS NODE", name: "NVIDIA RTX 4070 Ti Super", icon: Gpu, sub: "16GB GDDR6X / CUDA Engine Ready" },
                    selectedBlueprint === 2 && { label: "COMPUTE STACK", name: "AMD Ryzen 9 7905X Node", name_alt: "AMD Ryzen 9 7900X Node", icon: Cpu, sub: "12 Cores / 24 Threads Production Ready" },
                    selectedBlueprint === 2 && { label: "SYSTEM RAM", name: "64GB Kingston RGB DDR5", icon: MemoryStick, sub: "Dual-Channel Workstation Profile" },
                    selectedBlueprint === 2 && { label: "FAST STORAGE", name: "4TB Performance RAID SSD", icon: HardDrive, sub: "Dual Spec 2x2TB RAID Matrix" }
                  ].filter(Boolean).map((spec: any, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 rounded-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                        <spec.icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block tracking-wider uppercase">{spec.label}</span>
                        <strong className="text-slate-900 dark:text-white text-sm block font-bold truncate tracking-tight">{spec.name_alt || spec.name}</strong>
                        <span className="text-xs text-slate-600 dark:text-slate-400 block truncate leading-tight mt-0.5">{spec.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Performance Analytics Panel */}
                <div className="space-y-4 p-4.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150">
                  <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest font-bold">
                    Vetted Benchmark Indexes
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {[
                      selectedBlueprint === 0 && { label: "4K RAY-TRACING MODE", val: "98%", desc: "S-Tier Render" },
                      selectedBlueprint === 0 && { label: "RAW FRAME-TIME RATIO", val: "94%", desc: "Under 3.2ms" },
                      selectedBlueprint === 0 && { label: "AIRFLOW & COOLING STAGE", val: "90%", desc: "Airflow Max" },

                      selectedBlueprint === 1 && { label: "4K RAY-TRACING MODE", val: "80%", desc: "A-Tier Std" },
                      selectedBlueprint === 1 && { label: "RAW FRAME-TIME RATIO", val: "99%", desc: "Under 1.8ms" },
                      selectedBlueprint === 1 && { label: "AIRFLOW & COOLING STAGE", val: "92%", desc: "Low-db Fan" },

                      selectedBlueprint === 2 && { label: "4K RAY-TRACING MODE", val: "92%", desc: "Tensor Ready" },
                      selectedBlueprint === 2 && { label: "RAW FRAME-TIME RATIO", val: "85%", desc: "Cuda Suite" },
                      selectedBlueprint === 2 && { label: "AIRFLOW & COOLING STAGE", val: "96%", desc: "360mm Liquid" }
                    ].filter(Boolean).map((metric: any, mIdx) => (
                      <div key={mIdx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block leading-tight tracking-wider uppercase h-6 line-clamp-2">{metric.label}</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-base font-bold text-slate-900 dark:text-white">{metric.val}</span>
                          <span className="text-xs text-indigo-600 uppercase font-bold">{metric.desc}</span>
                        </div>
                        {/* Solid progress line - NO star icons! */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-100 dark:border-slate-800/60">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: metric.val }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  {selectedBlueprint === 0 && "Curated to operate zero bottleneck on absolute ultra graphic settings at Native 4K UHD resolutions."}
                  {selectedBlueprint === 1 && "Engineered with ultimate frame buffer hardware to max competitive responsiveness for 240Hz/360Hz displays."}
                  {selectedBlueprint === 2 && "Engineered with massive RAM resources to process complex AI computation layers, LLM training, and multi-threaded rendering."}
                </p>
                <button 
                  onClick={() => navigate('/builder')}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm whitespace-nowrap"
                >
                  <CircuitBoard className="w-4 h-4 text-indigo-150" /> Preloads into Custom Builder
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Trust & Testimonial Badges Section */}
      <div className="px-4 md:px-8 mb-16 md:mb-24">
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-14 relative overflow-hidden shadow-sm transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center font-sans">
            
            <div className="lg:col-span-4 space-y-4 font-sans">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 inline-block text-xs uppercase tracking-widest font-bold">
                PRO-BUILDER COMMUNITY APPROVAL
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight uppercase font-sans mt-3">
                Masterpieces Forged Daily
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed font-normal">
                See what elite gaming creators and software developers build using components sourced exclusively from QuantumRig. 100% genuine reviews from vetted owners.
              </p>
              <div className="flex items-center gap-2 pt-2 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold">100% Secure Shopping Guarantee</span>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              
              {/* Testimonial card 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> VERIFIED VETTED OWNER
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">RATING: 10 / 10</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed font-normal">
                  "I configured my whole PC on the PC builder tool. The compatibility checker saved me from choosing a cooler too big for my casing! Shipping took 1 day, pristine packaging. Exceptional service."
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm select-none">
                    MK
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm block font-bold">Mustafa Kabir</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Esports Competitor / Intel i9 Setup</span>
                  </div>
                </div>
              </div>

              {/* Testimonial card 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> VERIFIED VETTED OWNER
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">RATING: 10 / 10</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed font-normal">
                  "QuantumRig is by far the most polished PC building destination. Best prices, zero-fuss checkout, and an incredible user workflow. Highly recommend their custom builder tool!"
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm select-none">
                    AN
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm block font-bold">Ayesha N.</strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Blender Artist / Ryzen 9 Setup</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Recently Viewed & Searches Section */}
      <div className="px-4 md:px-8 mb-12 md:mb-20">
        <RecentlyViewed />
      </div>

      {/* Dynamic dynamic FAQ Section with Soft Deep Charcoal Palette */}
      <div className="px-4 md:px-8 mb-16 md:mb-24" id="homepage-faq-section">
        <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800/80 p-8 md:p-14 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start font-sans">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-slate-800 border border-slate-700/60 text-indigo-400 text-xs uppercase tracking-widest font-extrabold">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight uppercase">
                Got Questions?<br />We've Got Answers.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-normal">
                Explore our dynamically fetched guidelines on custom PC build workflows, processing stages, part compatibility, premium courier packaging, and transit guarantees.
              </p>
              
              <div className="pt-6 space-y-4 border-t border-slate-805 border-slate-800">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 shrink-0">
                    <CircuitBoard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Stress-Tested Assemblies</h4>
                    <p className="text-[11px] text-slate-400">Every rig is tested for 24 hours under maximum gaming load.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">100% Transit Protection</h4>
                    <p className="text-[11px] text-slate-400">Thick expandable foam braces heavy graphic cards during transit.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 font-sans">
              {faqs && faqs.length > 0 ? (
                faqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      className={`border-b border-slate-800/80 transition-all duration-300 ${
                        isOpen ? 'bg-slate-850/30' : ''
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full text-left py-4 flex items-center justify-between gap-4 text-white hover:text-indigo-400 transition-colors cursor-pointer group"
                      >
                        <span className="text-sm font-bold tracking-tight text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {faq.question}
                        </span>
                        <div className={`p-1.5 rounded-lg bg-slate-800 text-slate-400 transition-all group-hover:bg-slate-700/80 group-hover:text-white shrink-0 ${
                          isOpen ? 'bg-indigo-600 text-white rotate-180' : ''
                        }`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pb-5 text-slate-300 text-xs leading-relaxed font-normal antialiased">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-slate-850/20 rounded-2xl border border-slate-850">
                  <p className="text-slate-400 text-sm">No FAQs loaded yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhancements / Features Section */}
      <div className="px-8 mb-20">
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900 dark:text-white uppercase">The PC Builder's Choice</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed font-normal">
              We don't just sell parts. We provide an intuitive interactive builder ensuring all your components are 100% compatible. Expertly curate your next battlestation with zero guesswork.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                 <Zap className="w-8 h-8 text-amber-500 mb-4" />
                 <h3 className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 uppercase text-sm tracking-wide">Fast Delivery</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Express nationwide shipping on all custom orders and packages.</p>
               </div>
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                 <Box className="w-8 h-8 text-emerald-500 mb-4" />
                 <h3 className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 uppercase text-sm tracking-wide">Secure Packaging</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Your precious components are boxed with absolute extreme care and security.</p>
               </div>
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                 <Headphones className="w-8 h-8 text-indigo-500 mb-4" />
                 <h3 className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 uppercase text-sm tracking-wide">Expert Support</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Got a question during building? Our expert team is available 24/7 online.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
