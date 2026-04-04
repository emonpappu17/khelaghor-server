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

export type SSLCommerzValidationResponse = {
    status: string;
    tran_date: string;
    tran_id: string;
    val_id: string;
    amount: string;
    store_amount: string;
    currency: string;
    bank_tran_id: string;
    card_type: string;
    card_no: string;
    card_issuer: string;
    card_brand: string;
    card_issuer_country: string;
    card_issuer_country_code: string;
    currency_type: string;
    currency_amount: string;
    currency_rate: string;
    base_fair: string;
    value_a: string;
    value_b: string;
    value_c: string;
    value_d: string;
    risk_level: string;
    risk_title: string;
};

