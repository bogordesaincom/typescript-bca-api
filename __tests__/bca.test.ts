import * as dotenv from "dotenv";
import BcaService, {
    CurrencyInterface,
    IResponseToken,
    RateInterface,
} from "../lib/bca";
import ForexRate from "../lib/ForexRate";

dotenv.config();

describe("BCA API Integration Tests", () => {
    const bcaService = new BcaService();
    // const forexService = new ForexRate();

    describe("Token Generation", () => {
        it("should generate a valid access token", async () => {
            const tokenData: IResponseToken = await bcaService.generateToken();

            // console.log("Token Data", tokenData);
            expect(tokenData).toHaveProperty("access_token");
            expect(typeof tokenData.access_token).toBe("string");
            expect(tokenData.access_token.length).toBeGreaterThan(0);

            expect(tokenData).toHaveProperty("token_type");
            expect(tokenData.token_type).toBe("Bearer");

            expect(tokenData).toHaveProperty("expires_in");
        });

        it("should generate token with correct expiration time", async () => {
            const expData: IResponseToken = await bcaService.generateToken();
            expect(expData.expires_in).toBe(3600);
        });
    });

    it("should debug API configuration", async () => {
        const tokenData = await bcaService.generateToken();
        const token = tokenData.access_token;
        const timestamp = new Date().toISOString();
        const pathOnly = "/general/rate/forex";
        const url = `${bcaService.baseUrl}${pathOnly}`;

        // 🔐 Generate signature
        const signature = await bcaService.generateSignature(
            "GET",
            pathOnly,
            token,
            "",
            timestamp
        );

        // console.log("Request Headers:", {
        //     Authorization: `Bearer ${token}`,
        //     "X-BCA-Key": bcaService.API_KEY,
        //     "X-BCA-Timestamp": timestamp,
        //     "X-BCA-Signature": signature,
        // });

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-BCA-Key": bcaService.API_KEY,
                    "X-BCA-Timestamp": timestamp,
                    "X-BCA-Signature": signature,
                    // "Content-Type": "application/json", ❌ JANGAN pasang ini untuk GET
                },
            });

            const contentType = response.headers.get("content-type") || "";
            let result;
            if (contentType.includes("application/json")) {
                result = await response.json();
            } else {
                result = await response.text();
            }

            if (!response.ok) {
                throw new Error(
                    `Request failed: ${response.status} - ${result}`
                );
            }

            const mappers = result.Currencies.map((it: CurrencyInterface) => {
                const rates = it.RateDetail.map((rate: RateInterface) => {
                    return {
                        type: rate.RateType,
                        buy: Number(rate.Buy),
                        sell: Number(rate.Sell),
                        last_update: rate.LastUpdate as string,
                    };
                });

                return {
                    currency: it.CurrencyCode,
                    rates: rates,
                };
            });
            expect(response.status).toBe(200);
            expect(response.ok).toBe(true);
            expect(result).toHaveProperty("Currencies");

            // expect(mappers).toBe(3600);

            // console.log("Raw API Response:", response);
        } catch (error: any) {
            console.error("Raw Request Failed:", {
                message: error.message,
            });
            throw error;
        }
    });

    // Uncomment & update if ForexRate uses native fetch
    // describe("Forex Rate Service", () => {
    //   let testToken: string;

    //   beforeAll(async () => {
    //     const tokenData = await bcaService.generateToken();
    //     testToken = tokenData.access_token;
    //   });

    //   it("should retrieve forex rates successfully", async () => {
    //     const response = await forexService.getForexRate();
    //     console.log(response.data);
    //   });

    //   it("should handle API errors gracefully", async () => {
    //     // Add test for error handling if needed
    //   });
    // });
});
