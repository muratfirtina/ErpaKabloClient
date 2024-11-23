import { CartItem } from "./cartItem";

export interface CartSummary {
  selectedItems: CartItem[];
  totalPrice: number;
}