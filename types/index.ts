export type UserRole = 'admin' | 'cajero' | 'supervisor';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito' | 'mixto';
export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'venta';

export interface Business {
  id: string;
  name: string;
  currency: string;
  tax_rate: number;
  address?: string;
  phone?: string;
  email?: string;
  owner_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  business_id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
}

export interface Product {
  id: string;
  business_id: string;
  code: string;
  name: string;
  description?: string;
  category_id?: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  business_id: string;
  user_id: string;
  user_name: string;
  client_id?: string;
  client_name?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  cash_given?: number;
  change?: number;
  status: 'completed' | 'cancelled';
  created_at: string;
}

export interface StockMovement {
  id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  type: MovementType;
  quantity: number;
  note?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}
