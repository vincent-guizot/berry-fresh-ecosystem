import { CartItem, ShiftInfo, Product } from '../types';

const CART_KEY = 'berryfresh_pos_cart';
const SHIFT_KEY = 'berryfresh_pos_shift';
const OFFLINE_SALES_KEY = 'berryfresh_pos_offline_sales';
const PRODUCTS_KEY = 'berryfresh_pos_cached_products';

export interface QueuedSale {
  receipt_number: string;
  payload: any;
  queued_at: string;
}

export const saveLocalCart = (cart: CartItem[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
};

export const loadLocalCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const clearLocalCart = () => {
  localStorage.removeItem(CART_KEY);
};

export const saveLocalShift = (shift: ShiftInfo) => {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(shift));
};

export const loadLocalShift = (): ShiftInfo | null => {
  try {
    const raw = localStorage.getItem(SHIFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveOfflineSale = (sale: QueuedSale) => {
  try {
    const existing = loadOfflineSales();
    const updated = [...existing.filter((s) => s.receipt_number !== sale.receipt_number), sale];
    localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save offline sale', e);
  }
};

export const loadOfflineSales = (): QueuedSale[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const removeOfflineSale = (receiptNumber: string) => {
  try {
    const existing = loadOfflineSales();
    const filtered = existing.filter((s) => s.receipt_number !== receiptNumber);
    localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove offline sale', e);
  }
};

export const saveCachedProducts = (products: Product[]) => {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to cache products', e);
  }
};

export const loadCachedProducts = (): Product[] | null => {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
