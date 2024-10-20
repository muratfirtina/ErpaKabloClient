import { UserAddress } from "../user/userAddress";
import { OrderItem } from "./orderItem";
import { OrderStatus } from "./orderStatus";

export interface CreateOrder {id: string;
  orderDate: Date;
  orderCode: string;
  status: OrderStatus;
  totalPrice: number;
  userName: string;
  userAddress: UserAddress;
  phoneNumber: string;
  description: string;
  orderItems: OrderItem[];

    //paymentMethod?: string; // Ödeme yöntemi (opsiyonel)
  }