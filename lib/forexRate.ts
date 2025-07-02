import BCA from "./bca";

// In ForexRate.ts
export default class ForexRate {
    private bca: BCA;

    constructor(bcaInstance?: BCA) {
        this.bca = bcaInstance || new BCA();
    }

    async getForexRate(): Promise<any> {
        try {
            // Note: Sandbox uses different endpoint than production
            const endpoint = this.bca.baseUrl.includes("sandbox")
                ? "/general/rate/forex"
                : "/forex/forex-rates";

            const response = this.bca.service({
                method: "GET",
                url: endpoint,
                data: null, // Explicit null for empty body
            });

            return response;
        } catch (error: any) {
            console.error("API Error Details:", {
                status: error.response?.status,
                errorCode: error.response?.data?.ErrorCode,
                message: error.response?.data?.ErrorMessage,
            });
            throw error;
        }
    }
}
