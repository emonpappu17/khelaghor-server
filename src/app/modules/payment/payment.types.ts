type PaymentRecord = {
    id: string;
    bookingId: string;
    amount: number;
    currency: string;
    transactionId: string;
    expiresAt: Date;
};

type BookingRecord = {
    id: string;
    totalAmount: number;
    dueAmount: number;
};

type UserRecord = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
};

type SlotRecord = {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    field: {
        name: string;
        address: string;
    };
};
