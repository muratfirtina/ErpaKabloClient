export interface OrderStatusGroup {
    Ongoing: string[];
    Cancelled: string[];
    Refunded: string[];
    Completed: string[];
}

export const ORDER_STATUS_GROUPS: OrderStatusGroup = {
    Ongoing: ['Pending', 'Processing', 'Confirmed', 'Shipped'],
    Cancelled: ['Cancelled', 'Rejected'],
    Refunded: ['Refunded'],
    Completed: ['Completed']
};
