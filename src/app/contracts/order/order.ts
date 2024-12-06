import { PhoneNumber } from "../user/phoneNumber";
import { UserAddress } from "../user/userAddress";
import { OrderItem } from "./orderItem";

export interface Order{
    id: string;
    orderDate: Date;
    orderCode: string;
    status: string;
    totalPrice: number;
    userName: string;
    email: string;
    userAddress: UserAddress;
    phoneNumber: PhoneNumber;
    description: string;
    orderItems: OrderItem[];
    expanded?: boolean;
    adminNote?: string;

}