export interface Organization {
  id: string;
  name: string;
  defaultLowStockThreshold: number;
  currency?: string;
  currencySymbol?: string;
  taxRate?: number;
  phone?: string | null;
  address?: string | null;
  invoiceFooter?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  createdAt?: string;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface StockLog {
  id: string;
  organizationId: string;
  productId: string;
  changeAmount: number;
  previousQty: number;
  newQty: number;
  note?: string | null;
  updatedBy?: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category?: string | null;
  description?: string | null;
  quantity: number;
  costPrice?: number | null;
  sellingPrice?: number | null;
  lowStockThreshold?: number | null;
  effectiveThreshold: number;
  isLowStock: boolean;
  supplierId?: string | null;
  supplier?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  lastUpdatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice?: number | null;
  createdAt: string;
}

export interface Order {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  status: string;
  createdBy?: string | null;
  createdAt: string;
  items: OrderItem[];
  organization?: Organization;
}

export interface DashboardMetrics {
  organization: Organization;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalCostValuation: number;
    totalSellingValuation: number;
    lowStockCount: number;
    totalRevenue?: number;
    totalOrdersCount?: number;
    estimatedGrossProfit?: number;
  };
  lowStockItems: Product[];
  recentProducts: Product[];
  recentOrders?: Order[];
}
