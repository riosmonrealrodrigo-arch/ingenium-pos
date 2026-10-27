export type UserRole = 'admin' | 'cajero' | 'supervisor' | 'cliente';
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
  commercial_description?: string;
  image_url?: string;
  visible_en_tienda?: boolean;
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
  client_id?: string | null;
  client_name?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  cash_given?: number | null;
  change?: number | null;
  status: 'completed' | 'cancelled' | 'refunded';
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  returned_to_stock?: boolean;
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

export interface ChatConversation {
  id: string;
  business_id?: string | null;
  client_id?: string | null;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  status: 'open' | 'closed';
  unread_admin_count: number;
  unread_client_count: number;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'client' | 'admin' | 'bot';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface StorefrontCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export type RepairStatus =
  | 'recibido'
  | 'en_diagnostico'
  | 'esperando_repuesto'
  | 'listo_entrega'
  | 'entregado'
  | 'cancelado';

export interface RepairEvidence {
  id: string;
  image_url: string;
  stage?: RepairStatus | string;
  comment?: string;
  created_at: string;
}

export interface RepairOrder {
  id: string;
  folio: string;
  business_id: string;
  client_id?: string | null;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  device_brand: string;
  device_model: string;
  device_color?: string;
  imei_serial?: string;
  unlock_pattern?: string;
  accessories?: string;
  evidence?: RepairEvidence[];
  issue_reported: string;
  technician_diagnosis?: string;
  estimated_cost: number;
  advance_payment: number;
  status: RepairStatus;
  assigned_technician?: string;
  warranty_days?: number;
  warranty_starts_at?: string | null;
  warranty_expires_at?: string | null;
  cancellation_reason?: string | null;
  refund_amount?: number;
  received_at: string;
  completed_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export interface TicketSettings {
  id?: string;
  business_id: string;
  business_name: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  social_media?: string;
  warranty_note: string;
  repair_terms: string;
  default_format: 'thermal_58' | 'thermal_80' | 'letter';
  logo_url?: string;
}
