import { CartItem, ShiftInfo } from '../types';

const CART_KEY = 'berryfresh_pos_cart';
const SHIFT_KEY = 'berryfresh_pos_shift';

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
