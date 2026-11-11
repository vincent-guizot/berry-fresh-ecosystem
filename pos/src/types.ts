export interface Product {
  id: string;
  sku: string;
  barcode: string;
  plu_code: string;
  name: string;
  category: string;
  variety: string;
  uom: string;
  uom_name: string;
  is_catch_weight: boolean;
  price_cents: number;
  compare_at_price_cents?: number;
  image_url: string;
  shelf_life_days: number;
  storage_temp_c: number;
}

export interface CartItem {
  product: Product;
  quantity_base: number; // grams for catch-weight, pieces for clamshell
  unit_price_cents: number;
  line_total_cents: number;
  weighed_on_scale?: boolean;
}

export interface ShiftInfo {
  id: string;
  register_id: string;
  register_code: string;
  cashier_name: string;
  opened_at: string;
  opening_cash_float_cents: number;
  status: 'OPEN' | 'CLOSED';
  total_transactions: number;
  total_revenue_cents: number;
}

export interface ReceiptData {
  receipt_number: string;
  transacted_at: string;
  register_code: string;
  cashier_name: string;
  items: Array<{
    product_name: string;
    quantity_base: number;
    unit_price_cents: number;
    line_total_cents: number;
    is_catch_weight?: boolean;
  }>;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_amount_cents: number;
  payment_method: string;
  cash_tendered_cents?: number;
  cash_change_cents?: number;
}
