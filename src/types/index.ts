export type StockStatus = "available" | "low" | "out";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isDailySpecial: boolean;
  imageEmoji: string;
  stockStatus: StockStatus;
  availabilityLabel: string;
  canOrder: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageEmoji: string;
  maxQuantity: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItem: {
    id: string;
    name: string;
    imageEmoji: string;
    price: number;
  };
}

export interface Order {
  id: string;
  orderCode: string;
  tokenNumber: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  paymentRef?: string | null;
  paymentMethod?: string | null;
  totalAmount: number;
  createdAt: string;
  collectedAt?: string | null;
  user?: { name: string; studentId?: string | null };
  items: OrderItem[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "STAFF";
  studentId?: string | null;
}

export interface StockValidationError {
  menuItemId: string;
  name: string;
  requested: number;
  available: number;
  message: string;
}

export interface DailyAnalytics {
  date: string;
  ordersToday: number;
  revenueToday: number;
  ordersByStatus: { status: string; count: number }[];
  topItems: {
    menuItemId: string;
    name: string;
    imageEmoji: string;
    quantitySold: number;
  }[];
}

export interface Forecast {
  date: string;
  totalPredictedOrders: number;
  totalPredictedRevenue: number;
  items: {
    menuItemId: string;
    menuItemName: string;
    category: string;
    historicalAvg: number;
    predictedDemand: number;
    trend: "up" | "down" | "stable";
    currentStock: number;
    suggestedPrep: number;
  }[];
}
