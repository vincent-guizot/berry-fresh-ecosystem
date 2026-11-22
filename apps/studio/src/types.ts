export interface Batch {
  id: string;
  batch_code: string;
  product_id: string;
  product_name: string;
  farm_name: string;
  harvest_date: string;
  best_before_date: string;
  hours_remaining: number;
  quality_grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED' | string;
  brix: number;
  remaining_quantity_base: number;
  status: string;
  fefo_order: number;
}

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  plu_code: string;
  name: string;
  category: string;
  uom_name: string;
  price_cents: number;
  shelf_life_days: number;
  storage_temp_c: number;
}

export interface Shift {
  id: string;
  register_code: string;
  store_name: string;
  cashier_name: string;
  opened_at: string;
  closed_at?: string;
  opening_cash_float_cents: number;
  closing_cash_actual_cents?: number;
  expected_cash_cents?: number;
  cash_discrepancy_cents?: number;
  status: string;
  total_transactions: number;
  total_revenue_cents: number;
}
