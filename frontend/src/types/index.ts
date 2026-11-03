export interface Organization {
  id: string;
  name: string;
  defaultLowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  createdAt?: string;
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
  description?: string | null;
  quantity: number;
  costPrice?: number | null;
  sellingPrice?: number | null;
  lowStockThreshold?: number | null;
  effectiveThreshold: number;
  isLowStock: boolean;
  lastUpdatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
}

export interface DashboardMetrics {
  organization: Organization;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalCostValuation: number;
    totalSellingValuation: number;
    lowStockCount: number;
  };
  lowStockItems: Product[];
  recentProducts: Product[];
}
