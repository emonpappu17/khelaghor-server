import axios from "axios";
import { SSLCommerzSessionParams, SSLCommerzSessionResponse, SSLCommerzValidationResponse } from "../types/sslcommerz.types";
import { env } from "./env";

const SANDBOX_BASE = "https://sandbox.sslcommerz.com";
const LIVE_BASE = "https://securepay.sslcommerz.com";

const getBaseUrl = () => (env.SSLCOMMERZ_IS_LIVE ? LIVE_BASE : SANDBOX_BASE);

export const createSSLCommerzSession = async (
    params: SSLCommerzSessionParams
): Promise<SSLCommerzSessionResponse> => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/gwprocess/v4/api.php`;

    const payload = {
        store_id: env.SSLCOMMERZ_STORE_ID,
        store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
        ...params,
    };

    const { data } = await axios.post(url, payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });


    // const { data } = await axios({
    //     method: "POST",
    //     url: url,
    //     data: payload,
    //     headers: { "Content-Type": "application/x-www-form-urlencoded" }
    // })

    if (data.status !== "SUCCESS") {
        throw new Error(
            `SSLCommerz session creation failed: ${data.faession || "Unknown error"}`
        );
    }

    return data;
};

export const validateSSLCommerzTransaction = async (
    valId: string
): Promise<SSLCommerzValidationResponse> => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/validator/api/validationserverAPI.php`;

    const { data } = await axios.get(url, {
        params: {
            val_id: valId,
            store_id: env.SSLCOMMERZ_STORE_ID,
            store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
            format: "json",
        },
    });

    return data;
};
