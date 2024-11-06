import { PhoneNumber } from "../user/phoneNumber";
import { UserAddress } from "../user/userAddress";
import { OrderItem } from "./orderItem";
import { OrderStatus } from "./orderStatus";

export interface Order{
    id: string;
    orderDate: Date;
    orderCode: string;
    status: OrderStatus;
    totalPrice: number;
    userName: string;
    userAddress: UserAddress;
    phoneNumber: PhoneNumber;
    description: string;
    orderItems: OrderItem[];
    expanded?: boolean;
    adminNote?: string;

}