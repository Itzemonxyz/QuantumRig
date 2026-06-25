import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../../store";
import { api } from "../../lib/api";
import { Product } from "../../types";
import {
  ArrowUpDown,
  Plus,
  Minus,
  Trash2,
  X,
  PackagePlus,
  Copy,
  AlertCircle,
  GripVertical,
  UploadCloud,
  Image as ImageIcon,
  FileImage,
  Check,
  Sparkles,
  Coins,
  Eye,
  Tag,
  Folder,
  PlusCircle,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Shield,
  RefreshCw,
  Layers,
  ArrowLeft,
  Cpu,
  Upload,
  Heart,
  Scale,
  Share2,
  Bell,
  Zap,
  ShoppingCart,
  Undo,
  Redo,
  Save,
  BookmarkPlus,
} from "lucide-react";
import { motion } from "motion/react";
import TakaIcon from "../../components/TakaIcon";
import Papa from "papaparse";
import ImageCropModal from "../../components/ImageCropModal";

function FloatingLabelInput({ label, id, prefix, suffix, ...props }: any) {
  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-800 font-bold text-sm z-20 mt-2.5">
          {prefix}
        </span>
      )}
      <input 
        id={id} 
        {...props}
        placeholder=" "
        className={`block ${prefix ? 'pl-8' : 'px-3.5'} ${suffix ? 'pr-8' : 'pr-3.5'} pb-2.5 pt-5 w-full text-sm text-slate-800 bg-white rounded-xl border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 peer transition-all shadow-sm ${props.className || ''}`}
      />
      <label 
        htmlFor={id} 
        className={`absolute text-xs font-bold uppercase tracking-wider text-slate-500 duration-300 transform -translate-y-3.5 scale-75 top-4 z-10 origin-[0] ${prefix ? 'start-8' : 'start-3.5'} bg-white px-1 peer-focus:text-indigo-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider cursor-text select-none max-w-[calc(100%-2rem)] truncate whitespace-nowrap`}
      >
        {label}
      </label>
      {suffix && (
        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm z-20 mt-2.5">
          {suffix}
        </span>
      )}
    </div>
  );
}

function FloatingLabelTextarea({ label, id, ...props }: any) {
  return (
    <div className="relative w-full">
      <textarea 
        id={id} 
        {...props}
        placeholder=" "
        className={`block px-3.5 pb-2.5 pt-5 w-full text-sm text-slate-800 bg-white rounded-xl border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 peer transition-all shadow-sm ${props.className || ''}`}
      />
      <label 
        htmlFor={id} 
        className="absolute text-xs font-bold uppercase tracking-wider text-slate-500 duration-300 transform -translate-y-3.5 scale-75 top-4 z-10 origin-[0] start-3.5 bg-white px-1 peer-focus:text-indigo-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider cursor-text select-none max-w-[calc(100%-2rem)] truncate whitespace-nowrap"
      >
        {label}
      </label>
    </div>
  );
}

interface SuggestionItem {
  id: string;
  name: string;
  subText?: string;
  payload?: any;
}

function AutocompleteInput({
  label,
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder,
  required = false,
  type = "text",
  icon: Icon,
  error,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion: (item: SuggestionItem) => void;
  suggestions: SuggestionItem[];
  placeholder?: string;
  required?: boolean;
  type?: string;
  icon?: any;
  error?: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = suggestions
    .filter((s) => s.name.toLowerCase().includes((value || "").toLowerCase()))
    .slice(0, 5);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-20">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={`autocomplete-${label.replace(/\s+/g, '-')}`}
          required={required}
          type={type}
          placeholder=" "
          value={value}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          className={`block ${Icon ? 'pl-10' : 'px-3.5'} pr-4 pb-2.5 pt-5 w-full text-sm font-medium text-slate-800 bg-white rounded-xl border ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"} appearance-none focus:outline-none focus:ring-2 peer transition-all shadow-sm`}
        />
        <label 
          htmlFor={`autocomplete-${label.replace(/\s+/g, '-')}`}
          className={`absolute text-xs font-bold uppercase tracking-wider ${error ? 'text-rose-500' : 'text-slate-500 '} duration-300 transform -translate-y-3.5 scale-75 top-4 z-10 origin-[0] ${Icon ? 'start-10' : 'start-3.5'} bg-white px-1 peer-focus:text-indigo-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-xs peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider cursor-text select-none`}
        >
          {label}
        </label>
      </div>
      {error && (
        <span className="text-rose-500 text-[10px] uppercase font-bold mt-1 tracking-wider block">
          {error}
        </span>
      )}
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden divide-y divide-slate-50 animate-in fade-in duration-150">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSuggestion(item);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex flex-col pointer-events-auto"
            >
              <span className="text-sm font-bold text-slate-800">
                {item.name}
              </span>
              {item.subText && (
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {item.subText}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { products, categories, brands, setProducts, token, addToast } =
    useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [uploadingBatch, setUploadingBatch] = useState(false);
  const [syncPreview, setSyncPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBatch(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const bulkProducts = results.data.filter((r: any) => r.title || r.Title).map((row: any) => {
            const product: Partial<Product> = {
              id: row.id || row.Id,
              code: row.code || row.Code,
              title: row.title || row.Title || "",
              slug: (row.title || row.Title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              description: row.description || row.Description || "",
              price: parseFloat(row.price || row.Price || "0") || 0,
              inventoryCount: parseInt(row.inventoryCount || row.InventoryCount || "0") || 0,
              stockStatus: row.stockStatus || row.StockStatus || "In Stock",
              categoryId: row.categoryId || row.CategoryId || "",
              brand: row.brand || row.Brand || "",
              imageUrl: row.imageUrl || row.ImageUrl || "",
              warranty: row.warranty || row.Warranty || "",
              socket: row.socket || row.Socket || "",
              wattage: parseInt(row.wattage || row.Wattage || "0") || 0,
              specs: {}
            };
            
            const specsStr = row.specs || row.Specs;
            if (specsStr) {
               try {
                 product.specs = JSON.parse(specsStr);
               } catch (e) {
                 console.warn("Failed to parse specs JSON for", product.title);
               }
            }
            return product;
          });
          
          if (bulkProducts.length === 0) throw new Error("No valid products found in CSV.");
          
          await api.post("/products/bulk", { products: bulkProducts }, token);
          const updated = await api.get("/products");
          setProducts(updated);
          addToast(`Successfully batch uploaded ${bulkProducts.length} products`, "success");
          setIsBatchUploadModalOpen(false);
        } catch (err: any) {
          addToast(err.message || "Failed to process batch upload", "error");
        } finally {
          setUploadingBatch(false);
          if (batchFileInputRef.current) batchFileInputRef.current.value = "";
        }
      },
      error: (error: any) => {
        addToast(error.message || "Failed to parse CSV file", "error");
        setUploadingBatch(false);
        if (batchFileInputRef.current) batchFileInputRef.current.value = "";
      }
    });
  };

  const [draggedSegmentIdx, setDraggedSegmentIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Product>>({
    title: "",
    slug: "",
    categoryId: "",
    price: 0,
    stockStatus: "In Stock",
    imageUrl: "",
    description: "",
    specs: {},
    socket: "",
    wattage: 0,
    inventoryCount: 0,
  });

  interface SpecSegment {
    id: string;
    name: string;
    items: { id: string; key: string; value: string }[];
  }

  const parseSpecSegments = (specs: Record<string, string>): SpecSegment[] => {
    if (!specs || Object.keys(specs).length === 0)
      return [
        {
          id: Math.random().toString(),
          name: "General",
          items: [{ id: Math.random().toString(), key: "", value: "" }],
        },
      ];
    const map: Record<string, { id: string; key: string; value: string }[]> =
      {};
    Object.entries(specs).forEach(([k, v]) => {
      let seg = "General";
      let key = k;
      if (k.includes("|||")) {
        const parts = k.split("|||");
        seg = parts[0];
        key = parts[1];
      }
      if (!map[seg]) map[seg] = [];
      map[seg].push({ id: Math.random().toString(), key, value: String(v) });
    });
    return Object.entries(map).map(([name, items]) => ({
      id: Math.random().toString(),
      name,
      items,
    }));
  };

  const [specSegments, setSpecSegments] = useState<SpecSegment[]>([
    {
      id: "init",
      name: "General",
      items: [{ id: "init0", key: "", value: "" }],
    },
  ]);
  const [additionalImagesText, setAdditionalImagesText] = useState("");
  const [imageList, setImageList] = useState<string[]>([]);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Undo / Redo Manager
  const [history, setHistory] = useState<{form: any, specSegments: any, imageList: any}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipNextHistoryPush = useRef(false);

  useEffect(() => {
    if (skipNextHistoryPush.current) {
      // Don't record history when we are undoing/redoing
      skipNextHistoryPush.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const currentState = JSON.stringify({ form, specSegments, imageList });
      const lastRecordedStr = history[historyIndex] ? JSON.stringify(history[historyIndex]) : null;
      if (currentState !== lastRecordedStr) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ form, specSegments, imageList });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form, specSegments, imageList, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      skipNextHistoryPush.current = true;
      const prevState = history[historyIndex - 1];
      setForm(prevState.form);
      setSpecSegments(prevState.specSegments);
      setImageList(prevState.imageList);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      skipNextHistoryPush.current = true;
      const nextState = history[historyIndex + 1];
      setForm(nextState.form);
      setSpecSegments(nextState.specSegments);
      setImageList(nextState.imageList);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Spec Templates Manager
  const [specTemplates, setSpecTemplates] = useState<{id: string, name: string, segments: SpecSegment[]}[]>(() => {
    const saved = localStorage.getItem('admin_spec_templates');
    return saved ? JSON.parse(saved) : [
      {
        id: 'tpl_1', name: 'Standard Gaming PC', segments: [
          { id: "g1", name: "Core Setup", items: [{ id: "g1_1", key: "Processor", value: "Intel Core i5-12400F" }, { id: "g1_2", key: "Graphics", value: "RTX 3060 12GB" }] }
        ]
      },
      {
        id: 'tpl_2', name: 'Workstation', segments: [
          { id: "w1", name: "Compute", items: [{ id: "w1_1", key: "CPU", value: "AMD Ryzen Threadripper PRO" }, { id: "w1_2", key: "RAM", value: "128GB ECC DDR5" }] },
          { id: "w2", name: "Storage", items: [{ id: "w2_1", key: "Primary", value: "2TB Gen4 NVMe Desktop" }, { id: "w2_2", key: "Secondary", value: "8TB HDD Archive" }] }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('admin_spec_templates', JSON.stringify(specTemplates));
  }, [specTemplates]);

  const handleSaveSpecTemplate = () => {
    const name = window.prompt("Enter a name for this spec template (e.g. 'Standard Gaming PC'):");
    if (name) {
      setSpecTemplates(prev => [...prev, { id: Date.now().toString(), name, segments: specSegments }]);
      addToast(`Spec template "${name}" saved successfully!`, "success");
    }
  };

  const queryParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(queryParams.get("q") || "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStockAction, setBulkStockAction] = useState("");
  const [bulkPriceValue, setBulkPriceValue] = useState<number | "">("");
  const [sortField, setSortField] = useState<string>("custom");

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null,
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
  const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, number>>(
    {},
  );

  // Allow manual mouse wheel scrolling and edge auto-scrolling during drag operations
  useEffect(() => {
    if (activeDragId === null && draggedItemIndex === null) return;

    let animationFrameId: number;
    let currentY = 0;

    const handleGlobalWheel = (e: WheelEvent) => {
      window.scrollBy({
        top: e.deltaY,
        behavior: "auto",
      });
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      currentY = e.clientY;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        currentY = e.touches[0].clientY;
      }
    };

    const scrollCheck = () => {
      if (activeDragId === null && draggedItemIndex === null) return;

      const threshold = 120; // proximity in pixels to top/bottom of screen
      const maxSpeed = 15; // maximum scrolling speed
      const viewportHeight = window.innerHeight;

      if (currentY > 0) {
        if (currentY < threshold) {
          // scroll up: speed proportional to how close you are to the top
          const factor = (threshold - currentY) / threshold;
          const speed = Math.max(2, Math.round(factor * maxSpeed));
          window.scrollBy(0, -speed);
        } else if (currentY > viewportHeight - threshold) {
          // scroll down: speed proportional to how close you are to the bottom
          const factor = (currentY - (viewportHeight - threshold)) / threshold;
          const speed = Math.max(2, Math.round(factor * maxSpeed));
          window.scrollBy(0, speed);
        }
      }

      animationFrameId = requestAnimationFrame(scrollCheck);
    };

    window.addEventListener("wheel", handleGlobalWheel, { passive: true });
    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: true,
    });
    animationFrameId = requestAnimationFrame(scrollCheck);

    return () => {
      window.removeEventListener("wheel", handleGlobalWheel);
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeDragId, draggedItemIndex]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        if (!searchQuery.trim()) {
          setSearchedProducts(products);
          return;
        }
        const results = await api.get(
          `/admin/products/search?q=${encodeURIComponent(searchQuery)}`,
          token,
        );
        setSearchedProducts(results);
      } catch (err) {
        console.error(err);
      }
    };

    // Simple debounce
    const timer = setTimeout(() => {
      fetchSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, products, token]);

  const sortedProducts = [...searchedProducts].sort((a, b) => {
    if (sortField === "custom") {
      return (a.order ?? 99999) - (b.order ?? 99999);
    }
    if (sortField === "name_asc") {
      return a.title.localeCompare(b.title);
    }
    if (sortField === "name_desc") {
      return b.title.localeCompare(a.title);
    }
    if (sortField === "price_asc") {
      return a.price - b.price;
    }
    if (sortField === "price_desc") {
      return b.price - a.price;
    }
    if (sortField === "stock_asc") {
      const aStock = a.inventoryCount || 0;
      const bStock = b.inventoryCount || 0;
      return aStock - bStock;
    }
    if (sortField === "stock_desc") {
      const aStock = a.inventoryCount || 0;
      const bStock = b.inventoryCount || 0;
      return bStock - aStock;
    }
    if (sortField === "category_asc") {
      const aCat = categories.find((c) => c.id === a.categoryId)?.name || "";
      const bCat = categories.find((c) => c.id === b.categoryId)?.name || "";
      return aCat.localeCompare(bCat);
    }
    if (sortField === "brand_asc") {
      const aBrand = a.brand || "";
      const bBrand = b.brand || "";
      return aBrand.localeCompare(bBrand);
    }
    return (a.order ?? 99999) - (b.order ?? 99999);
  });

  // Custom Touch Event handlers for seamless mobile drag and drop support
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (sortField !== "custom") return;
    setDraggedItemIndex(index);
    setDragOverItemIndex(index);
    setActiveDragId(sortedProducts[index].id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (sortField !== "custom") return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    const row = targetElement?.closest("[data-index]");
    if (row) {
      const indexAttr = row.getAttribute("data-index");
      if (indexAttr !== null) {
        const hoverIndex = parseInt(indexAttr, 10);
        if (!isNaN(hoverIndex) && hoverIndex !== dragOverItemIndex) {
          setDragOverItemIndex(hoverIndex);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleDragStart = (index: number) => {
    if (sortField !== "custom") return;
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (sortField !== "custom") return;
    setDragOverItemIndex(index);
  };

  const handleDragEnd = async () => {
    setActiveDragId(null);
    if (
      draggedItemIndex === null ||
      dragOverItemIndex === null ||
      draggedItemIndex === dragOverItemIndex
    ) {
      setDraggedItemIndex(null);
      setDragOverItemIndex(null);
      return;
    }

    const newSorted = [...sortedProducts];
    const draggedItem = newSorted[draggedItemIndex];
    newSorted.splice(draggedItemIndex, 1);
    newSorted.splice(dragOverItemIndex, 0, draggedItem);

    const updatedProductsList = [...products];
    newSorted.forEach((p, idx) => {
      const mainIdx = updatedProductsList.findIndex((mp) => mp.id === p.id);
      if (mainIdx > -1) {
        updatedProductsList[mainIdx].order = idx;
      }
    });
    updatedProductsList.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));

    setProducts(updatedProductsList);
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);

    try {
      await api.post(
        "/products/reorder",
        { reorderedProducts: updatedProductsList },
        token,
      );
      const updated = await api.get("/products");
      setProducts(updated);
    } catch (e) {
      addToast("Failed to save product order", "error");
      const original = await api.get("/products");
      setProducts(original);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkUpdateStock = async () => {
    if (!bulkStockAction || selectedIds.length === 0) return;
    setLoading(true);
    for (const id of selectedIds) {
      const p = products.find((p) => p.id === id);
      if (p) {
        await api.put(
          `/products/${id}`,
          { ...p, stockStatus: bulkStockAction },
          token,
        );
      }
    }
    const updated = await api.get("/products");
    setProducts(updated);
    addToast(
      `Successfully updated stock for ${selectedIds.length} products!`,
      "success",
    );
    setSelectedIds([]);
    setBulkStockAction("");
    setLoading(false);
  };

  const handleBulkUpdatePrice = async () => {
    if (bulkPriceValue === "" || selectedIds.length === 0) return;
    setLoading(true);
    for (const id of selectedIds) {
      const p = products.find((p) => p.id === id);
      if (p) {
        await api.put(
          `/products/${id}`,
          { ...p, price: Number(bulkPriceValue) },
          token,
        );
      }
    }
    const updated = await api.get("/products");
    setProducts(updated);
    addToast(
      `Successfully updated price for ${selectedIds.length} products!`,
      "success",
    );
    setSelectedIds([]);
    setBulkPriceValue("");
    setLoading(false);
  };

  const handleClone = (p: Product) => {
    const { id, code, ...rest } = p;
    let newCode = code || "";
    if (newCode) newCode = `${newCode}-CLONE`;

    setForm({
      ...rest,
      title: `${rest.title} (Clone)`,
      code: newCode,
      variants: p.variants || [],
      warranty: p.warranty || "",
    });
    setSpecSegments(parseSpecSegments(p.specs || {}));
    setAdditionalImagesText(p.additionalImages?.join("\n") || "");
    setImageList([p.imageUrl, ...(p.additionalImages || [])].filter(Boolean));
    setIsEditing(true);
  };

  const handleEdit = (p: Product) => {
    setForm({
      ...p,
      variants: p.variants || [],
      warranty: p.warranty || "",
    });
    setSpecSegments(parseSpecSegments(p.specs || {}));
    setAdditionalImagesText(p.additionalImages?.join("\n") || "");
    setImageList([p.imageUrl, ...(p.additionalImages || [])].filter(Boolean));
    setIsEditing(true);
  };

  const handleNew = () => {
    const savedDraft = localStorage.getItem("productDraft");
    if (savedDraft) {
      if (window.confirm("You have an unsaved product draft. Do you want to restore it?")) {
        const parsed = JSON.parse(savedDraft);
        setForm(parsed.form);
        setSpecSegments(parsed.specSegments || []);
        setImageList(parsed.imageList || []);
        setIsEditing(true);
        return;
      } else {
        localStorage.removeItem("productDraft");
      }
    }
    setForm({
      title: "",
      slug: "",
      categoryId: categories[0]?.id || "",
      price: 0,
      stockStatus: "In Stock",
      imageUrl: "",
      description: "",
      specs: {},
      socket: "",
      wattage: 0,
      inventoryCount: 0,
      variants: [],
      warranty: "",
    });
    setSpecSegments([{
      id: Math.random().toString(),
      name: "General",
      items: [{ id: Math.random().toString(), key: "", value: "" }],
    }]);
    setAdditionalImagesText("");
    setImageList([]);
    setIsEditing(true);
  };

  useEffect(() => {
    let interval: any;
    if (isEditing && !form.id && form.title) {
      interval = setInterval(() => {
        localStorage.setItem("productDraft", JSON.stringify({
          form,
          specSegments,
          imageList
        }));
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isEditing, form, specSegments, imageList]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`, token);
      const updated = await api.get("/products");
      setProducts(updated);
    } catch (e) {
      console.error(e);
      alert("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetStock = async (p: Product, newInventoryCount: number) => {
    try {
      const sanitizedCount = Math.max(0, newInventoryCount);
      const newStockStatus = sanitizedCount > 0 ? "In Stock" : "Out of Stock";
      const payload = {
        ...p,
        inventoryCount: sanitizedCount,
        stockStatus: newStockStatus,
      };
      await api.put(`/products/${p.id}`, payload, token);
      const updated = await api.get("/products");
      setProducts(updated);
      addToast(
        `Updated stock count for ${p.title} to ${sanitizedCount}!`,
        "success",
      );
    } catch (e) {
      console.error(e);
      addToast("Failed to update stock count", "error");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title) newErrors.title = "Title is required";
    if (!form.categoryId) newErrors.categoryId = "Category is required";
    if (!form.price || form.price <= 0)
      newErrors.price = "Price must be greater than 0";
    if (form.discountPrice && form.price && form.discountPrice >= form.price) {
      newErrors.discountPrice =
        "Discount price must be less than regular price";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const specs: Record<string, string> = {};
    specSegments.forEach((segment) => {
      segment.items.forEach((item) => {
        if (item.key.trim() && item.value.trim()) {
          specs[`${segment.name.trim()}|||${item.key.trim()}`] =
            item.value.trim();
        }
      });
    });

    const mainImageUrl = imageList[0] || form.imageUrl || "";
    const additionalImagesList = imageList.length > 1 ? imageList.slice(1) : [];

    const payload = {
      ...form,
      imageUrl: mainImageUrl,
      additionalImages: additionalImagesList,
      specs,
    };

    try {
      if (form.id) {
        await api.put(`/products/${form.id}`, payload, token);
      } else {
        await api.post("/products", payload, token);
      }
      const updated = await api.get("/products");
      setProducts(updated);
      setIsEditing(false);
      addToast(
        form.id
          ? "Product updated successfully!"
          : "Product created successfully!",
        "success",
      );
    } catch (e) {
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    // Computed recommendations for the active category
    const activeCategoryProducts = products.filter(
      (p) => p.categoryId === form.categoryId,
    );
    const avgPrice =
      activeCategoryProducts.length > 0
        ? Math.round(
            activeCategoryProducts.reduce((sum, p) => sum + (p.price || 0), 0) /
              activeCategoryProducts.length,
          )
        : 0;

  const handleCropComplete = async (croppedBase64: string) => {
    setCropImageSrc(null);
    addToast("Optimizing and uploading image assets...", "info");
    try {
      // Lazy load to prevent issues
      const { generateOptimizedImages } = await import("../../lib/imageOptimizer");
      const { original, thumbnails } = await generateOptimizedImages(croppedBase64);
      
      const res = await api.post("/upload", { image: original }, token);
      const finalUrl = res?.url || original;
      
      setImageList((prev) => {
        if (prev.includes(finalUrl)) return prev;
        return [...prev, finalUrl];
      });
      
      setForm((prev) => ({
        ...prev,
        thumbnails: {
          ...(prev.thumbnails || {}),
          ...thumbnails
        }
      }));
      addToast("Uploaded optimized asset!", "success");
    } catch (err) {
      console.error("Image upload failed", err);
      setImageList((prev) => [...prev, croppedBase64]);
    }
  };

    const handleFilesUpload = async (files: FileList) => {
      if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === "string") {
            setCropImageSrc(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesUpload(e.target.files);
      }
    };

    return (
      <div className="p-6 max-w-7xl mx-auto col-span-12">
        {/* Workspace Header with Innovative Console theme */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Admin Center // Instant Launcher</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {form.id
                ? `Edit Product // ${form.title || "Draft"}`
                : "Launch New Product"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 mr-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSyncPreview(!syncPreview)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border ${
                syncPreview
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Eye className={`w-4 h-4 ${syncPreview ? "text-indigo-500" : "text-slate-500"}`} />
              Sync Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({
                  title: "",
                  slug: "",
                  categoryId: categories[0]?.id || "",
                  price: 0,
                  stockStatus: "In Stock",
                  imageUrl: "",
                  description: "",
                  specs: {},
                  socket: "",
                  wattage: 0,
                  inventoryCount: 0,
                });
                setImageList([]);
                setSpecSegments([
                  {
                    id: Math.random().toString(),
                    name: "General",
                    items: [
                      { id: Math.random().toString(), key: "", value: "" },
                    ],
                  },
                ]);
                addToast("Cleared editing draft template!", "success");
              }}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-transparent flex items-center justify-center"
              title="Return to general products table"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`gap-8 mx-auto w-full flex ${syncPreview ? "flex-col lg:flex-row max-w-[1800px]" : "flex-col max-w-[1400px]"}`}
        >
          <div className={`flex flex-col xl:flex-row gap-8 items-start w-full ${syncPreview ? "flex-1" : ""}`}>
            {/* LEFT COLUMN: Data Fields Form */}
            <div className="flex-1 w-full flex flex-col gap-8 items-stretch">
              {/* BOX 1: General HW Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-2">
                  <FileImage className="w-4 h-4 text-indigo-500 shrink-0" />
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                    Metadata General Configuration
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Product Code */}
                  <div>
                    <FloatingLabelInput
                      label="Product Code (Optional)"
                      id="product-code"
                      type="text"
                      value={form.code || ""}
                      onChange={(e: any) =>
                        setForm({ ...form, code: e.target.value })
                      }
                      className="bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Autocomplete Title with Clone template feature */}
                  <div className="relative">
                    <AutocompleteInput
                      label="Product Title"
                      placeholder="Enter model name (e.g. Core i9 / RTX 4090)"
                      value={form.title || ""}
                      required
                      onChange={(val) => {
                        setForm({
                          ...form,
                          title: val,
                          slug: (val || "")
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-"),
                        });
                      }}
                      suggestions={products.map((p) => ({
                        id: p.id,
                        name: p.title,
                        subText: `${p.brand || "Hardware"} - ৳${p.price.toLocaleString()}`,
                        payload: p,
                      }))}
                      onSelectSuggestion={(item) => {
                        const p = item.payload;
                        if (p) {
                          const confirmTemplate = window.confirm(
                            `Rapid Launch: Use "${p.title}" as a boilerplate baseline template to fill up categories, brand, price and specifications?`,
                          );
                          if (confirmTemplate) {
                            setForm({
                              ...form,
                              title: p.title,
                              slug: (p.title || "")
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-"),
                              brand: p.brand || "",
                              categoryId: p.categoryId,
                              price: p.price,
                              discountPrice: p.discountPrice,
                              description: p.description,
                              socket: p.socket || "",
                              wattage: p.wattage || 0,
                              stockStatus: p.stockStatus,
                              inventoryCount: p.inventoryCount || 0,
                            });
                            setSpecSegments(parseSpecSegments(p.specs || {}));
                            setImageList(
                              [
                                p.imageUrl,
                                ...(p.additionalImages || []),
                              ].filter(Boolean),
                            );
                            addToast(
                              "Quick boilerplate template imported!",
                              "success",
                            );
                          } else {
                            setForm({
                              ...form,
                              title: p.title,
                              slug: (p.title || "")
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-"),
                            });
                          }
                        }
                      }}
                      icon={Cpu}
                      error={errors.title}
                    />
                  </div>

                  {/* Autocomplete Brand */}
                  <div className="relative">
                    <AutocompleteInput
                      label="Brand Name"
                      placeholder="ASUS, Intel, MSI, AMD, etc."
                      value={form.brand || ""}
                      onChange={(val) => setForm({ ...form, brand: val })}
                      suggestions={brands.map((b) => ({
                        id: b.id,
                        name: b.name,
                        subText: "Verified Manufacturer",
                      }))}
                      onSelectSuggestion={(item) => {
                        setForm({ ...form, brand: item.name });
                      }}
                      icon={Tag}
                    />
                  </div>

                  {/* Autocomplete Category */}
                  <div className="relative">
                    <AutocompleteInput
                      label="Official Category"
                      placeholder="Search or enter PC category"
                      value={
                        categories.find((c) => c.id === form.categoryId)
                          ?.name || ""
                      }
                      required
                      onChange={(val) => {
                        const matched = categories.find(
                          (c) =>
                            (c.name || "").toLowerCase() === val.toLowerCase(),
                        );
                        if (matched) {
                          setForm({ ...form, categoryId: matched.id });
                        } else {
                          setForm({ ...form, categoryId: val });
                        }
                      }}
                      suggestions={categories.map((c) => ({
                        id: c.id,
                        name: c.name,
                        subText: "Active System Category",
                      }))}
                      onSelectSuggestion={(item) => {
                        setForm({ ...form, categoryId: item.id });
                      }}
                      icon={Folder}
                      error={errors.categoryId}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <FloatingLabelTextarea
                    id="product-description"
                    label="Detailed Description"
                    required
                    value={form.description || ""}
                    onChange={(e: any) => {
                      setForm({ ...form, description: e.target.value });
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    ref={(el: any) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                    style={{ minHeight: "80px", overflow: "hidden" }}
                    className="resize-none"
                    rows={3}
                  />
                </div>
                
                {/* SEO Metadata Preview */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Google Search Preview</p>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm w-full font-sans">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                         <span className="text-[10px] font-bold text-slate-500">QR</span>
                      </div>
                      <div className="flex flex-col leading-tight overflow-hidden flex-1">
                        <span className="text-sm text-[#202124] font-medium">QuantumRig</span>
                        <span className="text-xs text-[#4d5156] truncate">
                          https://quantum-rig.com/products/{form.slug || 'product-slug-preview'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight mb-1 truncate">
                      {form.title ? `${form.title} - QuantumRig Store` : 'Product Title Preview - QuantumRig Store'}
                    </div>
                    <div className="text-sm text-[#4d5156] line-clamp-2">
                      {form.description ? form.description : 'Your product description will appear here on Google search results. It helps customers understand what the product is before clicking.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX 2: Pricing, Stock, and Inventory Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                    Pricing & Stock Metrics
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Regular Price input with automatic smart recommendations */}
                  <div className="relative">
                    <FloatingLabelInput
                      id="product-price"
                      label="Regular Price (৳)"
                      prefix="৳"
                      required
                      type="text"
                      value={
                        form.price === undefined || isNaN(form.price)
                          ? ""
                          : form.price.toLocaleString("en-US")
                      }
                      onChange={(e: any) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setForm({
                          ...form,
                          price: val ? parseFloat(val) : 0,
                        });
                      }}
                      onBlur={(e: any) => {
                        const val = parseFloat(
                          e.target.value.replace(/[^0-9.]/g, ""),
                        );
                        if (!isNaN(val)) {
                          setForm({ ...form, price: val });
                        }
                      }}
                      className={`font-semibold ${errors.price ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : ""}`}
                    />
                    {errors.price && (
                      <span className="text-rose-500 text-[10px] uppercase font-bold mt-1 tracking-wider block">
                        {errors.price}
                      </span>
                    )}
                    {avgPrice > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, price: avgPrice })}
                        className="mt-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        MSRP Suggestion (৳{avgPrice.toLocaleString()})
                      </button>
                    )}
                  </div>

                  {/* Offer Price input with dynamic calculation */}
                  <div>
                    <FloatingLabelInput
                      id="product-discount"
                      label="Offer / Special Price (Optional)"
                      prefix="৳"
                      type="text"
                      value={
                        form.discountPrice === undefined ||
                        isNaN(form.discountPrice)
                          ? ""
                          : form.discountPrice.toLocaleString("en-US")
                      }
                      onChange={(e: any) => {
                        if (!e.target.value) {
                          setForm({ ...form, discountPrice: undefined });
                          return;
                        }
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setForm({
                          ...form,
                          discountPrice: val ? parseFloat(val) : undefined,
                        });
                      }}
                      onBlur={(e: any) => {
                        if (!e.target.value) return;
                        const val = parseFloat(
                          e.target.value.replace(/[^0-9.]/g, ""),
                        );
                        if (!isNaN(val))
                          setForm({ ...form, discountPrice: val });
                      }}
                      className={`font-semibold text-indigo-600 ${errors.discountPrice ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : ""}`}
                    />
                    {errors.discountPrice && (
                      <span className="text-rose-500 text-[10px] uppercase font-bold mt-1 tracking-wider block">
                        {errors.discountPrice}
                      </span>
                    )}
                    {form.price ? (
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            discountPrice: Math.round(form.price! * 0.95),
                          })
                        }
                        className="mt-1.5 text-[11px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Calculate 5% Promo discount (৳
                        {Math.round(form.price * 0.95).toLocaleString()})
                      </button>
                    ) : null}
                  </div>

                  {/* Stock Status Selection */}
                  <div className="relative">
                    <label className="absolute text-[10px] font-bold uppercase tracking-wider text-slate-500 z-10 top-1.5 start-3.5 px-1 bg-white leading-tight">
                      Warehouse Stock Status
                    </label>
                    <select
                      value={form.stockStatus || "In Stock"}
                      onChange={(e) =>
                        setForm({ ...form, stockStatus: e.target.value as any })
                      }
                      className="block px-3.5 pb-2.5 pt-5 w-full text-sm font-medium text-slate-800 bg-white rounded-xl border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 cursor-pointer transition-all shadow-sm"
                    >
                      <option value="In Stock">
                        In Stock (Active Selling)
                      </option>
                      <option value="Low Stock">Low Stock Alert</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Discontinued">
                        Discontinued (Archived)
                      </option>
                    </select>
                  </div>

                  {/* Inventory Stock Count */}
                  <div>
                    <FloatingLabelInput
                      id="product-inventory"
                      label="Warehouse Item Count"
                      required
                      type="number"
                      min="0"
                      value={
                        form.inventoryCount === undefined ||
                        isNaN(form.inventoryCount)
                          ? ""
                          : form.inventoryCount
                      }
                      onChange={(e: any) => {
                        const count = parseInt(e.target.value) || 0;
                        setForm({
                          ...form,
                          inventoryCount: count,
                          stockStatus: count > 0 ? "In Stock" : "Out of Stock",
                        });
                      }}
                      className="font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* BOX 3: Technical Specs (Socket, Wattage, Key-Value) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                    Hardware Characteristics
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <FloatingLabelInput
                      id="product-socket"
                      label="Socket Support (Optional)"
                      type="text"
                      value={form.socket || ""}
                      onChange={(e: any) =>
                        setForm({ ...form, socket: e.target.value })
                      }
                      className="font-medium"
                    />
                  </div>
                  <div>
                    <FloatingLabelInput
                      id="product-wattage"
                      label="Power Budget (Wattage)"
                      type="number"
                      value={
                        form.wattage === undefined || isNaN(form.wattage)
                          ? ""
                          : form.wattage
                      }
                      onChange={(e: any) =>
                        setForm({ ...form, wattage: parseInt(e.target.value) })
                      }
                      className="font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Custom Hardware Specifications
                    </label>
                    <div className="flex items-center justify-start sm:justify-end gap-2">
                      <div className="relative group">
                         <button type="button" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors">
                           <BookmarkPlus className="w-3 h-3" /> Load Template
                         </button>
                         <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-48 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden z-50">
                           {specTemplates.map(tpl => (
                             <button
                               key={tpl.id}
                               type="button"
                               onClick={() => setSpecSegments(JSON.parse(JSON.stringify(tpl.segments)))}
                               className="block w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-100 last:border-0 font-medium"
                             >
                               {tpl.name}
                             </button>
                           ))}
                         </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveSpecTemplate}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                      >
                        <Save className="w-3 h-3" /> Save current
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {specSegments.map((segment, sIdx) => (
                      <div
                        key={segment.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedSegmentIdx(sIdx);
                          e.dataTransfer.effectAllowed = "move";
                          // Required for Firefox
                          e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedSegmentIdx === null || draggedSegmentIdx === sIdx) return;
                          const newSegments = [...specSegments];
                          const draggedItem = newSegments[draggedSegmentIdx];
                          newSegments.splice(draggedSegmentIdx, 1);
                          newSegments.splice(sIdx, 0, draggedItem);
                          setSpecSegments(newSegments);
                          setDraggedSegmentIdx(null);
                        }}
                        className={`bg-slate-50/50 border border-slate-200 rounded-xl p-4 transition-all cursor-move ${draggedSegmentIdx === sIdx ? 'opacity-50 ring-2 ring-indigo-500' : ''}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <button type="button" className="text-slate-400 cursor-grab shrink-0">
                            <span className="text-lg leading-none flex items-center justify-center">⋮⋮</span>
                          </button>
                          <input
                            type="text"
                            value={segment.name}
                            onChange={(e) => {
                              const newSegments = [...specSegments];
                              newSegments[sIdx].name = e.target.value;
                              setSpecSegments(newSegments);
                            }}
                            className="flex-1 bg-transparent font-bold text-slate-800 text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-500 transition-colors outline-none px-1 py-0.5"
                            placeholder="Segment Name (e.g. Memory, Connectivity)"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSpecSegments(
                                specSegments.filter((_, i) => i !== sIdx),
                              );
                            }}
                            className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          {segment.items.map((item, iIdx) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={item.key}
                                onChange={(e) => {
                                  const newSegments = [...specSegments];
                                  newSegments[sIdx].items[iIdx].key =
                                    e.target.value;
                                  setSpecSegments(newSegments);
                                }}
                                className="w-1/3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
                                placeholder="Spec Label"
                              />
                              <input
                                type="text"
                                value={item.value}
                                onChange={(e) => {
                                  const newSegments = [...specSegments];
                                  newSegments[sIdx].items[iIdx].value =
                                    e.target.value;
                                  setSpecSegments(newSegments);
                                }}
                                className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSegments = [...specSegments];
                                  newSegments[sIdx].items = newSegments[
                                    sIdx
                                  ].items.filter((_, i) => i !== iIdx);
                                  setSpecSegments(newSegments);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSegments = [...specSegments];
                            newSegments[sIdx].items.push({
                              id: Math.random().toString(),
                              key: "",
                              value: "",
                            });
                            setSpecSegments(newSegments);
                          }}
                          className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Spec
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setSpecSegments([
                          ...specSegments,
                          {
                            id: Math.random().toString(),
                            name: "New Segment",
                            items: [
                              {
                                id: Math.random().toString(),
                                key: "",
                                value: "",
                              },
                            ],
                          },
                        ]);
                      }}
                      className="w-full flex justify-center items-center gap-1.5 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Segment Group
                    </button>
                  </div>
                </div>
              </div>

              {/* BOX 4: Variants & Warranty Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                  <h3 className="font-bold text-slate-850 text-xs uppercase tracking-widest font-sans">
                    Variants & Warranty Panels
                  </h3>
                </div>

                {/* Warranty Segment */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Product Warranty Segment
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={form.warranty || ""}
                      onChange={(e) =>
                        setForm({ ...form, warranty: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 transition-all outline-none"
                      placeholder="e.g. 3 Years Brand Warranty, No Warranty"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1 select-none">
                    {[
                      "No Warranty",
                      "1 Year Warranty",
                      "2 Years Warranty",
                      "3 Years Brand Warranty",
                      "Lifetime Warranty",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setForm({ ...form, warranty: preset })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
 form.warranty === preset
 ? "bg-indigo-50 border-indigo-200 text-indigo-600"
 : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 "
 }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variants Dynamic Panel */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <div>
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Dynamic Variants System
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Add product choices (e.g. Color, Type, RAM option)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVariants = form.variants || [];
                        setForm({
                          ...form,
                          variants: [
                            ...currentVariants,
                            { name: "", options: [] },
                          ],
                        });
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 hover:text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Variant
                    </button>
                  </div>

                  {!form.variants || form.variants.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 select-none col-span-12">
                      <Sliders className="w-8 h-8 text-slate-300 mx-auto mb-1.5 stroke-1" />
                      <span className="text-xs font-semibold text-slate-500 block">
                        No Active Product Variants
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Variant panel will remain closed for this model.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.variants.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 relative group/var"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (form.variants || []).filter(
                                (_, idx) => idx !== vIdx,
                              );
                              setForm({ ...form, variants: updated });
                            }}
                            className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors p-1"
                            title="Remove Variant option type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Variant Name
                              </label>
                              <input
                                type="text"
                                required
                                value={v.name}
                                onChange={(e) => {
                                  const updated = [...(form.variants || [])];
                                  updated[vIdx] = {
                                    ...updated[vIdx],
                                    name: e.target.value,
                                  };
                                  setForm({ ...form, variants: updated });
                                }}
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-800 transition-all outline-none"
                                placeholder="e.g. Color, Size, RAM"
                              />
                            </div>

                            <div className="md:col-span-8 pr-6">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Add Options
                              </label>
                              <div className="flex gap-1.5">
                                <input
                                  id={`new-option-${vIdx}`}
                                  type="text"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const input = e.currentTarget;
                                      const val = input.value.trim();
                                      if (val) {
                                        const updated = [
                                          ...(form.variants || []),
                                        ];
                                        if (
                                          !updated[vIdx].options.includes(val)
                                        ) {
                                          updated[vIdx].options = [
                                            ...updated[vIdx].options,
                                            val,
                                          ];
                                          setForm({
                                            ...form,
                                            variants: updated,
                                          });
                                        }
                                        input.value = "";
                                      }
                                    }
                                  }}
                                  className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-slate-700 outline-none"
                                  placeholder="Type options (e.g. 16GB) & press Enter"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(
                                      `new-option-${vIdx}`,
                                    ) as HTMLInputElement;
                                    const val = input?.value.trim();
                                    if (val) {
                                      const updated = [
                                        ...(form.variants || []),
                                      ];
                                      if (
                                        !updated[vIdx].options.includes(val)
                                      ) {
                                        updated[vIdx].options = [
                                          ...updated[vIdx].options,
                                          val,
                                        ];
                                        setForm({ ...form, variants: updated });
                                      }
                                      if (input) input.value = "";
                                    }
                                  }}
                                  className="px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* List Option Badges */}
                          <div className="mt-2.5 flex flex-wrap gap-1.5 select-none">
                            {v.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg leading-none shadow-sm font-sans"
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(form.variants || [])];
                                    updated[vIdx].options = updated[
                                      vIdx
                                    ].options.filter((_, i) => i !== oIdx);
                                    setForm({ ...form, variants: updated });
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-50 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            {v.options.length === 0 && (
                              <span className="text-[10px] text-amber-500 font-bold">
                                Please add at least one option.
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Image Manager Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 select-none">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-pink-500 shrink-0" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                      Interactive Galleries
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                    {imageList.length} Files loaded
                  </span>
                </div>

                {/* Direct image input link with clear text label, resolving the default image input prompt */}
                <div className="space-y-2 select-none">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Main Default Image URL Input
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageList[0] || ""}
                      onChange={(e) => {
                        const newUrl = e.target.value.trim();
                        setImageList((prev) => {
                          const next = [...prev];
                          if (next.length > 0) next[0] = newUrl;
                          else if (newUrl) next.push(newUrl);
                          return next.filter(Boolean);
                        });
                      }}
                      className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2 px-3.5 text-xs text-slate-800 transition-all outline-none font-mono"
                      placeholder="https://example.com/main-hardware.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt(
                          "Input or paste absolute URL of main product image:",
                        );
                        if (url) {
                          setImageList((prev) =>
                            [url, ...prev].filter(Boolean),
                          );
                        }
                      }}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 transition-all flex items-center justify-center shrink-0"
                      title="Paste Image link"
                    >
                      <PlusCircle className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Robust Drag & Drop zone supporting multiple base64 captures */}
                <div
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-500/80 bg-slate-50/50 hover:bg-white rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative select-none"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(
                      "border-indigo-500",
                      "bg-indigo-50/25",
                    );
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-indigo-500",
                      "bg-indigo-50/25",
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-indigo-500",
                      "bg-indigo-50/25",
                    );
                    if (e.dataTransfer.files) {
                      handleFilesUpload(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => {
                    const input = document.getElementById(
                      "hidden-file-input-edit",
                    );
                    input?.click();
                  }}
                >
                  <input
                    id="hidden-file-input-edit"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                  <span className="text-sm font-bold text-slate-800 block leading-tight">
                    Drag and Drop 4-5 Images
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    or click to browse from local computer
                  </span>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mt-3.5 block">
                    Clickable Plus / Multi Drop Uploads
                  </span>
                </div>

                {/* Proportional Expanded Gallery Thumbnails Box, resolving "Fix issue where box stayed small" */}
                {imageList.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between select-none">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Real-time Asset Gallery
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setImageList([]);
                          addToast("Cleared product assets deck", "info");
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:underline uppercase tracking-wider"
                      >
                        Clear Assets
                      </button>
                    </div>

                    {/* Grid elements for image previewing and changing default state */}
                    <div className="grid grid-cols-2 gap-3">
                      {imageList.map((img, idx) => {
                        const isMain = idx === 0;
                        return (
                          <div
                            key={idx}
                            className={`group/card relative rounded-xl border overflow-hidden bg-slate-50 transition-all flex flex-col justify-between ${isMain ? "border-2 border-indigo-500 shadow-md ring-4 ring-indigo-50 bg-white " : "border-slate-200"}`}
                          >
                            {/* Sized correctly, no squishing, robust rendering */}
                            <div className="aspect-video w-full flex items-center justify-center p-2 bg-white relative">
                              <img
                                src={img}
                                alt={`Preview ${idx}`}
                                className="max-h-24 max-w-full object-contain"
                              />

                              {isMain ? (
                                <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 select-none font-sans">
                                  <Check className="w-2.5 h-2.5 shrink-0" />
                                  Default
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageList((prev) => {
                                      const next = [...prev];
                                      const item = next.splice(idx, 1)[0];
                                      return [item, ...next];
                                    });
                                    addToast(
                                      "New default item selected!",
                                      "success",
                                    );
                                  }}
                                  className="absolute top-1.5 left-1.5 opacity-0 group-hover/card:opacity-100 bg-slate-900/90 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-opacity"
                                >
                                  Set Main
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setImageList((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                  addToast("Image removed", "info");
                                }}
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-opacity"
                                title="Delete model image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="p-1 px-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-[9px] text-slate-400 truncate max-w-[80px] font-mono">
                                {img.startsWith("data:")
                                  ? "Base64 Local"
                                  : "External Asset"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 pb-12 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                  }}
                  className="px-5 py-3 border border-slate-200 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 font-bold uppercase text-xs tracking-wider rounded-xl transition-all"
                >
                  Cancel Draft
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {form.id ? "Save Updates" : "Launch Product Official"}
                </button>
              </div>
            </div>
          </div>

          {/* High-fidelity Visual Preview Mockup */}
          {syncPreview ? (
            <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 flex flex-col gap-4 sticky top-6 max-h-[calc(100vh-48px)]">
              <div className="bg-[#F8F9FA] rounded-2xl border border-slate-200 p-4 shadow-sm flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 select-none mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                     <Eye className="w-5 h-5 text-indigo-600 shrink-0" />
                     <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">
                       Live Sync Preview
                     </h3>
                  </div>
                  <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>
                <div className={`relative overflow-y-auto overflow-x-hidden p-2 rounded-xl border border-slate-200 bg-white mx-auto w-full flex-1 ${
                  previewDevice === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
                }`}>
                  <div className={previewDevice === 'desktop' ? 'scale-75 origin-top-left w-[133%]' : 'w-full'}>
                    <PreviewCard
                      form={form}
                      imageList={imageList}
                      categories={categories}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#F8F9FA] rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 select-none">
                <Eye className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-800">
                  Public Product Page Preview Layout
                </h3>
              </div>
              <div className="relative">
                <PreviewCard
                  form={form}
                  imageList={imageList}
                  categories={categories}
                />
              </div>
            </div>
          )}
        </form>

        {cropImageSrc && (
          <ImageCropModal
            imageSrc={cropImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropImageSrc(null)}
          />
        )}
      </div>
    );
  }

  const handleDownloadCSV = () => {
    const headers = [
      "code",
      "title",
      "brand",
      "categoryId",
      "price",
      "discountPrice",
      "inventoryCount",
      "stockStatus",
      "imageUrl",
      "description",
      "socket",
      "wattage",
    ];
    const csvContent = [
      headers.join(","),
      ...products.map((p) =>
        [
          p.code || p.id,
          `"${(p.title || "").replace(/"/g, '""')}"`,
          `"${p.brand || ""}"`,
          p.categoryId,
          p.price || 0,
          p.discountPrice || "",
          p.inventoryCount || 0,
          p.stockStatus || "In Stock",
          `"${(p.imageUrl || "").replace(/"/g, '""')}"`,
          `"${(p.description || "").replace(/"/g, '""')}"`,
          `"${p.socket || ""}"`,
          p.wattage || 0,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedProducts = results.data.map((row: any) => ({
            code: row.code || undefined,
            title: row.title || "Untitled",
            brand: row.brand || "",
            categoryId: row.categoryId || categories[0]?.id || "",
            price: parseFloat(row.price) || 0,
            discountPrice: row.discountPrice
              ? parseFloat(row.discountPrice)
              : undefined,
            inventoryCount: parseInt(row.inventoryCount) || 0,
            stockStatus: row.stockStatus || "In Stock",
            imageUrl: row.imageUrl || "",
            description: row.description || "",
            socket: row.socket || "",
            wattage: parseInt(row.wattage) || 0,
          }));

          const res = await api.post(
            "/products/bulk",
            { products: parsedProducts },
            token,
          );
          addToast(
            `Bulk importing processing... ${res.successCount} items synced.`,
            "success",
          );

          const updated = await api.get("/products");
          setProducts(updated);
        } catch (err) {
          console.error(err);
          addToast("Failed to import CSV.", "error");
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (err) => {
        console.error(err);
        addToast("Error reading CSV file", "error");
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex-shrink-0">
          Products
        </h2>

        <div className="flex-1 w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by product code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUploadCSV}
          />
          <button
            onClick={() => setIsBatchUploadModalOpen(true)}
            disabled={loading}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow-sm hover:bg-indigo-100 transition-colors whitespace-nowrap flex-1 sm:flex-none"
          >
            <UploadCloud className="w-4 h-4 mr-1 shrink-0" /> Batch Upload (CSV)
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-emerald-500 transition-colors whitespace-nowrap flex-1 sm:flex-none"
          >
            Download CSV
          </button>
          <button
            onClick={handleNew}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow hover:bg-indigo-500 transition-colors whitespace-nowrap flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-1 shrink-0" /> Add Product
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-indigo-800">
            {selectedIds.length} product(s) selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStockAction}
              onChange={(e) => setBulkStockAction(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Update Stock Status...</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
            <button
              onClick={handleBulkUpdateStock}
              disabled={loading || !bulkStockAction}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Apply Status
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="New Bulk Price"
              value={bulkPriceValue}
              onChange={(e) =>
                setBulkPriceValue(e.target.value ? Number(e.target.value) : "")
              }
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-32"
            />
            <button
              onClick={handleBulkUpdatePrice}
              disabled={loading || bulkPriceValue === ""}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Apply Price
            </button>
          </div>
        </div>
      )}

      {/* Select All, Sorting Options Action Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <label className="flex items-center space-x-3 text-sm text-slate-600 font-medium cursor-pointer self-start sm:self-auto">
          <input
            type="checkbox"
            checked={
              searchedProducts.length > 0 &&
              selectedIds.length === searchedProducts.length
            }
            onChange={handleSelectAll}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
          />
          <span>Select All Products ({sortedProducts.length})</span>
        </label>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest shrink-0">
            Sort By
          </span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 cursor-pointer w-full sm:w-48"
          >
            <option value="custom">Custom Order (Draggable)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="stock_asc">Stock Count (Low to High)</option>
            <option value="stock_desc">Stock Count (High to Low)</option>
            <option value="category_asc">Category Name (A-Z)</option>
            <option value="brand_asc">Brand Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 space-y-4">
        {sortedProducts.map((p, index) => {
          const isCurrentlyDragged = draggedItemIndex === index;
          const isSelected = selectedIds.includes(p.id);
          const showIndicatorAbove =
            draggedItemIndex !== null &&
            dragOverItemIndex === index &&
            index < draggedItemIndex;
          const showIndicatorBelow =
            draggedItemIndex !== null &&
            dragOverItemIndex === index &&
            index > draggedItemIndex;

          return (
            <div
              key={p.id}
              data-index={index}
              className="relative transition-all duration-150"
            >
              {/* Visual Drop Placement Line Indicator */}
              {showIndicatorAbove && (
                <div className="h-1.5 w-full bg-indigo-500 rounded-full my-2 animate-pulse shadow-[0_0_12px_#6366f1]" />
              )}

              <div
                draggable={sortField === "custom" && activeDragId === p.id}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onClick={() => handleEdit(p)}
                className={`group flex flex-col sm:flex-row items-center justify-between p-5 bg-white border rounded-2xl shadow-sm transition-all duration-200 cursor-pointer select-none
 ${isCurrentlyDragged ? "opacity-40 border-dashed border-2 border-indigo-500 bg-indigo-50 scale-[0.98] shadow-lg" : isSelected ? "border-indigo-400 bg-indigo-50/20 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
              >
                {/* Left Block: Reorder Grabber, Selection Checkbox, Image and Info */}
                <div
                  className={`flex items-center space-x-4 flex-1 w-full min-w-0 ${draggedItemIndex !== null ? "pointer-events-none" : ""}`}
                >
                  {/* Grab Handle - only active and visible when Custom Order sort is active */}
                  {sortField === "custom" && (
                    <div
                      className="cursor-grab hover:bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors active:cursor-grabbing select-none shrink-0 pointer-events-auto"
                      onMouseDown={() => setActiveDragId(p.id)}
                      onTouchStart={(e) => {
                        setActiveDragId(p.id);
                        handleTouchStart(e, index);
                      }}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseUp={() => {
                        if (draggedItemIndex === null) setActiveDragId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                  )}

                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectProduct(p.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-5 h-5 shrink-0 pointer-events-auto"
                  />

                  {/* Image */}
                  <img
                    src={p.thumbnails?.["150"] || p.imageUrl}
                    alt={p.title}
                    className="w-16 h-16 object-contain bg-slate-50 border border-slate-100 rounded-xl shrink-0 p-1"
                  />

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {p.brand && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {p.brand}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {categories.find((c) => c.id === p.categoryId)?.name ||
                          "PC Component"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate pr-2">
                      {p.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Code:{" "}
                      <strong className="font-semibold text-slate-600">
                        {p.code || "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Right Block: Price, Stock, Actions */}
                <div
                  className={`flex flex-col sm:flex-row items-center justify-between sm:space-x-8 space-y-4 sm:space-y-0 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 ${draggedItemIndex !== null ? "pointer-events-none" : ""}`}
                >
                  {/* Price Block */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="font-bold text-slate-900 text-lg flex items-center justify-center sm:justify-end">
                      <TakaIcon className="w-4 h-4 mr-[1px]" />
                      {Number(p.price || 0).toLocaleString("en-BD", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {p.discountPrice && (
                      <span
                        className={`text-xs mt-0.5 flex items-center justify-center sm:justify-end gap-1 ${p.discountPrice > p.price ? "text-rose-600 font-bold" : "text-emerald-600 font-medium"}`}
                        title={
                          p.discountPrice > p.price
                            ? "Offer price is higher than regular price!"
                            : ""
                        }
                      >
                        <TakaIcon className="w-3 h-3" />
                        {Number(p.discountPrice || 0).toLocaleString("en-BD", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        (Offer)
                        {p.discountPrice > p.price && (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Stock Status Block */}
                  <div className="shrink-0 text-center">
                    <motion.div
                      key={p.inventoryCount}
                      initial={{ scale: 1.1, backgroundColor: "#fef3c7" }}
                      animate={{ scale: 1, backgroundColor: "transparent" }}
                      transition={{ duration: 0.4 }}
                      className="inline-block rounded-xl px-3 py-1 bg-slate-50"
                    >
                      {p.stockStatus === "Out of Stock" ||
                      p.inventoryCount === 0 ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : p.inventoryCount !== undefined &&
                        p.inventoryCount < 5 ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                          Low Stock ({p.inventoryCount})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {p.stockStatus} ({p.inventoryCount})
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* Action Controls */}
                  <div
                    className="flex items-center space-x-2 shrink-0 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {adjustingStockId === p.id ? (
                      <div
                        className="flex items-center space-x-2 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const currentVal =
                              adjustAmounts[p.id] !== undefined &&
                              adjustAmounts[p.id] !== ""
                                ? parseInt(adjustAmounts[p.id])
                                : p.inventoryCount || 0;
                            const newVal = Math.max(0, currentVal - 1);
                            setAdjustAmounts((prev) => ({
                              ...prev,
                              [p.id]: newVal.toString(),
                            }));
                            await handleSetStock(p, newVal);
                          }}
                          className="w-9 h-9 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold transition-colors shadow-sm flex items-center justify-center shrink-0"
                          title="Subtract Stock (-1)"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={
                            adjustAmounts[p.id] !== undefined
                              ? adjustAmounts[p.id]
                              : p.inventoryCount || 0
                          }
                          onChange={(e) => {
                            const valStr = e.target.value;
                            setAdjustAmounts((prev) => ({
                              ...prev,
                              [p.id]: valStr,
                            }));

                            if (valStr !== "") {
                              const valInt = parseInt(valStr, 10);
                              if (!isNaN(valInt) && valInt >= 0) {
                                handleSetStock(p, valInt);
                              }
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 text-center bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 h-9"
                          placeholder="Count"
                        />

                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const currentVal =
                              adjustAmounts[p.id] !== undefined &&
                              adjustAmounts[p.id] !== ""
                                ? parseInt(adjustAmounts[p.id])
                                : p.inventoryCount || 0;
                            const newVal = currentVal + 1;
                            setAdjustAmounts((prev) => ({
                              ...prev,
                              [p.id]: newVal.toString(),
                            }));
                            await handleSetStock(p, newVal);
                          }}
                          className="w-9 h-9 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm flex items-center justify-center shrink-0"
                          title="Add Stock (+1)"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustingStockId(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 w-9 h-9 hover:bg-slate-200 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdjustingStockId(p.id);
                          setAdjustAmounts((prev) => ({
                            ...prev,
                            [p.id]: (p.inventoryCount || 0).toString(),
                          }));
                        }}
                        className="text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl border border-transparent hover:border-indigo-150 transition-all shadow-sm bg-white flex items-center space-x-1"
                        title="Adjust Stock"
                      >
                        <PackagePlus className="w-4 h-4" />
                        <span className="text-xs font-semibold px-0.5">
                          Adjust Stock
                        </span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      disabled={deletingId === p.id}
                      title="Delete"
                      className="text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl border border-transparent hover:border-rose-100 transition-all shadow-sm bg-white disabled:opacity-50"
                    >
                      {deletingId === p.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {showIndicatorBelow && (
                <div className="h-1.5 w-full bg-indigo-500 rounded-full my-2 animate-pulse shadow-[0_0_12px_#6366f1]" />
              )}
            </div>
          );
        })}
      </div>

      {isBatchUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <UploadCloud className="w-5 h-5 mr-2 text-indigo-600" />
                Batch Product Upload (CSV)
              </h3>
              <button
                onClick={() => setIsBatchUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
                disabled={uploadingBatch}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 leading-relaxed shadow-sm">
                <p className="font-bold mb-2 flex items-center text-indigo-900">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" /> Supported Columns:
                </p>
                <p className="opacity-90">
                  <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">id</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">code</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">title</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">price</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">categoryId</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">brand</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">stockStatus</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">inventoryCount</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">imageUrl</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">description</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">warranty</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">socket</code>, <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">wattage</code>, and <code className="bg-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">specs</code> (as JSON string).
                </p>
                <p className="mt-3 text-xs opacity-80 italic">
                  Note: Any omitted fields will default to empty text or 0. Items without a title will be skipped.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 transition-colors bg-slate-50 cursor-pointer" onClick={() => !uploadingBatch && batchFileInputRef.current?.click()}>
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-slate-600 font-medium font-sans">
                  {uploadingBatch ? "Processing CSV..." : "Click to select CSV file"}
                </p>
                <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={batchFileInputRef}
                    onChange={handleBatchFileChange}
                    disabled={uploadingBatch}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setIsBatchUploadModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={uploadingBatch}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function PreviewCard({
  form,
  imageList,
  categories,
}: {
  form: any;
  imageList: string[];
  categories: any[];
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const images = imageList.length > 0 ? imageList : [""];
  const activeImage = images[activeImgIdx] || "";
  const displayPrice =
    form.discountPrice && form.discountPrice > 0
      ? form.discountPrice
      : form.price;

  const categoryName =
    categories.find((c) => c.id === form.categoryId)?.name || "CPU";

  // Extract text for specs inline string
  const inlineSpecs = form.specs
    ? Object.entries(form.specs)
        .map(
          ([key, val]) =>
            `${key
              .replace(/([A-Z])/g, " $1")
              .trim()
              .replace(/^./, (str) => str.toUpperCase())}: ${val}`,
        )
        .join("; ")
    : "";

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row p-6 gap-8">
      {/* Left Column: Image */}
      <div className="w-full md:w-1/2 flex flex-col items-center">
        <div className="w-full aspect-square relative bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-6 group">
          {activeImage ? (
            <img
              src={activeImage}
              alt={form.title}
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 md:group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <FileImage className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <span className="text-sm font-semibold text-slate-400 font-sans">
                No Image
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails below */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 w-full justify-center">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImgIdx(idx);
                }}
                className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center p-1 overflow-hidden transition-colors ${idx === activeImgIdx ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300"}`}
              >
                <img
                  src={img}
                  alt=""
                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Details */}
      <div className="w-full md:w-1/2 flex flex-col text-left">
        {/* Top Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[#5B45FF] bg-[#5B45FF]/10 text-xs font-bold px-3 py-1 rounded select-none uppercase tracking-wider">
            {categoryName}
          </span>
          <span className="text-slate-600 bg-slate-100 text-xs font-bold px-3 py-1 rounded select-none uppercase tracking-wider">
            {form.brand || "BRAND"}
          </span>
          {form.code && (
            <span className="text-slate-600 bg-slate-100 text-xs font-medium px-3 py-1 rounded flex items-center gap-2 select-none">
              Product Code: <strong>{form.code}</strong>
              <Copy className="w-3 h-3 text-slate-400 cursor-pointer" />
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-3xl font-bold text-slate-900 leading-tight font-sans">
            {form.title || "Product Title Placeholder"}
          </h2>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Heart className="w-3.5 h-3.5" /> Save
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Scale className="w-3.5 h-3.5" /> Add to Compare
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Bell className="w-3.5 h-3.5" /> Price Drop Alert
          </button>
        </div>

        {/* Pricing Row */}
        <div className="flex items-center flex-wrap gap-3 mb-6">
          <span className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <TakaIcon className="w-6 h-6 mr-0.5" strokeWidth={2.5} />
            {Number(displayPrice || 0).toLocaleString("en-IN")}
          </span>
          {form.discountPrice && form.discountPrice < form.price && (
            <span className="text-lg text-slate-400 line-through flex items-center font-medium">
              <TakaIcon className="w-4 h-4 mr-0.5" />
              {Number(form.price || 0).toLocaleString("en-IN")}
            </span>
          )}
          <span
            className={`text-sm px-3 py-1 rounded-full border font-semibold ml-2 ${form.stockStatus === "Out of Stock" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
          >
            {form.stockStatus === "Out of Stock" ? (
              "Out of Stock"
            ) : (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" strokeWidth={3} /> In Stock
              </span>
            )}
          </span>
        </div>

        {/* Inline Specs */}
        {inlineSpecs && (
          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
            {inlineSpecs.length > 200
              ? inlineSpecs.substring(0, 200) + "..."
              : inlineSpecs}
          </p>
        )}

        {/* Warranty Box */}
        <div className="border border-slate-200 bg-[#F8F9FA] p-4 rounded-xl flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#5B45FF]/10 text-[#5B45FF] p-2.5 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                HARDWARE ASSURANCE
              </div>
              <div className="text-sm font-bold text-slate-900">
                {form.warranty || "Brand Warranty Applicable"}
              </div>
            </div>
          </div>
          <div className="text-[9px] font-bold text-[#5B45FF] bg-[#5B45FF]/10 px-2 py-1 rounded uppercase tracking-wider">
            ACCREDITED POLICY
          </div>
        </div>

        {/* Add to Cart Controls */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center border border-slate-200 rounded-lg h-12 bg-white w-32 shrink-0">
            <button className="flex-1 flex items-center justify-center font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-full rounded-l-lg transition-colors">
              -
            </button>
            <div className="flex-1 flex items-center justify-center font-bold text-slate-900 border-x border-slate-200 h-full">
              1
            </div>
            <button className="flex-1 flex items-center justify-center font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-full rounded-r-lg transition-colors">
              +
            </button>
          </div>
          <button
            type="button"
            className="flex-1 h-12 bg-[#5B45FF] hover:bg-indigo-700 text-white rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </button>
        </div>

        {/* Quick Buy Controls */}
        <div className="mb-3">
          <button
            type="button"
            className="w-full h-12 bg-[#F59E0B] hover:bg-amber-600 text-white rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4 fill-white" /> Quick Buy
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Zap className="w-3 h-3 text-[#F59E0B]" />
          Quick Buy securely checks out with one click
        </div>
      </div>
    </div>
  );
}
