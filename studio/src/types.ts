export interface Batch {
  id: string;
  batch_code: string;
  product_id: string;
  product_name: string;
  farm_name: string;
  harvest_date: string;
  best_before_date: string;
  hours_remaining: number;
  quality_grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED';
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
