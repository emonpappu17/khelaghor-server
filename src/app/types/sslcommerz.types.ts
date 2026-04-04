export type SSLCommerzSessionParams = {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    // Customer info
    cus_name: string;
    cus_email: string;
    cus_phone: string;
    cus_add1: string;
    cus_city: string;
    cus_country: string;
    // Product info
    product_name: string;
    product_category: string;
    product_profile: string;
    // Shipping (N/A for digital service)
    shipping_method: string;
    num_of_item: number;
    // Optional
    value_a?: string; // bookingId
    value_b?: string; // paymentId
    value_c?: string; // userId
    value_d?: string; // extra
};

export type SSLCommerzSessionResponse = {
    status: string;
    failedreason: string;
    sessionkey: string;
    GatewayPageURL: string;
    redirectGatewayURL: string;
    redirectGatewayURLFailed: string;
    storeBanner: string;
    storeLogo: string;
    desc: Array<{ name: string; type: string; logo: string; gw: string }>;
};

