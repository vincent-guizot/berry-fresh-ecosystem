export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  variety: string;
  uom_name: string;
  price_cents: number;
  compare_at_price_cents?: number;
  image_url: string;
  shelf_life_days: number;
  storage_temp_c: number;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
