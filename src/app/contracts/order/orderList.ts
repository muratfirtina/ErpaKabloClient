import { OrderItem } from "./orderItem";
import { OrderStatus } from "./orderStatus";

export interface OrderList {
    id: string;
    orderDate: Date;    
    orderCode: string;
    status: OrderStatus;
    totalPrice: number;
    userName: string;
}
