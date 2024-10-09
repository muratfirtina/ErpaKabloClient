import { OrderItem } from "./orderItem";
import { OrderStatus } from "./orderStatus";

export interface OrderList {
    id: string;
    orderDate: Date;
    orderCode: string;
    orderStatus: OrderStatus;
    totalPrice: number;
    userName: string;
    orderItems: OrderItem[];
}
