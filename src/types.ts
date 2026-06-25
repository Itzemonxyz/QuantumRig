export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPLOAD';
  entityType: 'PRODUCT';
  entityId?: string;
  details: string;
  adminId: string;
  adminName?: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice?: number;
  createdAt: string;
}

export interface UserCartItem {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  password?: string;
  role: 'admin' | 'user' | 'staff';
  roleId?: string;
  savedProductIds?: string[];
  loyaltyPoints?: number;
  notifications?: UserNotification[];
  cart?: UserCartItem[];
  deletionRequested?: boolean;
  createdAt?: string;
  lastVisited?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: {
    dashboard: boolean;
    orders: boolean;
    products: boolean;
    inventory: boolean;
    customers: boolean;
    settings: boolean;
    promotions: boolean;
    support: boolean;
    roles: boolean;
  };
  createdAt: string;
}

export interface RestockRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  status: 'pending' | 'accepted' | 'fulfilled';
  createdAt: string;
}

export interface SharedBuild {
  id: string;
  items: Record<string, string>; // categoryId -> productId
  totalPrice: number;
  totalWattage: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  applicableProductIds: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  order?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  code?: string;
  order?: number;
  title: string;
  slug: string;
  categoryId: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  inventoryCount?: number;
  imageUrl: string;
  additionalImages?: string[];
  thumbnails?: Record<string, string>; // e.g. { '150': url, '600': url }
  description: string;
  // Specific specs for PC Builder
  specs: Record<string, string>;
  specSegments?: { segment: string; items: { key: string; value: string }[] }[];
  socket?: string; // For CPU/Motherboard
  wattage?: number; // For PSU or general consumption
  reviews?: Review[];
  variants?: ProductVariant[];
  warranty?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedOptions?: Record<string, string>;
  warranty?: string;
}

export interface TrackingStep {
  status: string;
  date: string;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';
  deliveryDetails: {
    fullName: string;
    address: string;
    phone: string;
    email?: string;
    instructions?: string;
  };
  trackingHistory?: TrackingStep[];
  courierName?: string;
  trackingNumber?: string;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentStatus?: 'Pending' | 'Verified' | 'Failed';
  createdAt: string;
}

export interface Settings {
  announcementText: string;
  facebookUrl?: string; // Legacy
  whatsappUrl?: string; // Legacy
  instagramUrl?: string; // Legacy
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  orderBreakdown: { Pending: number; Verified: number; Delivered: number; Shipped: number };
  topProducts: { title: string; count: number }[];
  salesData: { name: string; revenue: number }[];
}

export interface Offer {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  active: boolean;
  linkUrl?: string;
  buttonText?: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  active: boolean;
  linkUrl?: string; // Redirect path
  createdAt?: string;
  type?: 'main' | 'fixed-1' | 'fixed-2'; // Banner slot/location
}

export interface SupportTicket {
  id: string;
  productId: string;
  email: string;
  question: string;
  status: 'Open' | 'Closed' | 'Answered';
  answer?: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface StockAdjustmentLog {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  userEmail: string;
  userName: string;
  amountChanged: number;
  newQuantity: number;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  category?: string;
  question: string;
  answer: string;
  order: number;
}

