import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { useStore } from '../store';

interface ExpertTipProps {
  categoryId: string | null;
}

export default function ExpertTip({ categoryId }: ExpertTipProps) {
  const { builderCart, categories } = useStore();
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find(c => c.id === categoryId)?.name || 'Components';

  const fetchTip = async () => {
    setIsLoading(true);
    setError(null);
    setIsOpen(true);
    try {
      const response = await api.post('/gemini/expert-tip', {
        categoryId,
        categoryName,
        currentCart: builderCart
      });
      setTip(response.tip);
    } catch (err) {
      console.error(err);
      setError("Unable to generate tip right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block mt-3 ml-2">
      <button
        onClick={fetchTip}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full w-fit shadow-sm hover:shadow-md transition-shadow"
      >
        <Sparkles className="w-4 h-4" />
        <span>Get Expert AI Tip</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Expert Tip</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <div className="flex items-center space-x-2 py-2">
                     <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                     <span className="text-slate-500 text-xs">Analyzing your build...</span>
                  </div>
                ) : error ? (
                  <span className="text-rose-500 text-xs">{error}</span>
                ) : (
                  <p className="leading-relaxed">{tip}</p>
                )}
              </div>
            </div>
            
            {/* Decorative gradient border bottom */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-600"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
