import crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

interface IRequest {
    method: string;
    url: string;
    data?: any;
}

export interface IResponseToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface IExpiresIn {
    expires_in: number;
}

export interface RateInterface {
    RateType: string;
    Buy: string;
    Sell: string;
    LastUpdate: string;
}

export interface CurrencyInterface {
    CurrencyCode: string;
    RateDetail: RateInterface[];
}

export default class BcaService {
    private CLIENT_ID = process.env.BCA_CLIENT_ID || "";
    private CLIENT_SECRET = process.env.BCA_CLIENT_SECRET || "";
    private API_KEY_SECRET = process.env.BCA_API_KEY_SECRET || "";
    public API_KEY = process.env.BCA_API_KEY || "";
    private ACCESS_TOKEN = "";

    public baseUrl =
        process.env.NODE_ENV !== "production"
            ? "https://sandbox.bca.co.id"
            : "https://api.klikbca.com:443";

    public async service(config: IRequest) {
        if (!this.ACCESS_TOKEN) {
            await this.generateToken();
        }

        const timestamp = new Date().toISOString();
        const method = config.method.toUpperCase();
        const fullUrl = new URL(config.url, this.baseUrl);
        const pathOnly = fullUrl.pathname;

        const requestBody = config.data || "";
        const signature = await this.generateSignature(
            method,
            pathOnly,
            this.ACCESS_TOKEN,
            requestBody,
            timestamp
        );

        const headers: HeadersInit = {
            Authorization: `Bearer ${this.ACCESS_TOKEN}`,
            "X-BCA-Key": this.API_KEY,
            "X-BCA-Timestamp": timestamp,
            "X-BCA-Signature": signature,
            "Content-Type": "application/json",
        };

        const response = await fetch(fullUrl.href, {
            method,
            headers,
            body: ["POST", "PUT", "PATCH"].includes(method)
                ? JSON.stringify(config.data || {})
                : undefined,
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`BCA API Error: ${response.status} - ${errorData}`);
        }

        return response.json();
    }

    public async generateToken(): Promise<IResponseToken> {
        const tokenUrl = `${this.baseUrl}/api/oauth/token`;
        const grantType = "grant_type=client_credentials";

        const headers: HeadersInit = {
            Authorization: `Basic ${this.encodeAuthorization()}`,
            "Content-Type": "application/x-www-form-urlencoded",
        };

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers,
            body: grantType,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token Error: ${response.status} - ${errorText}`);
        }

        const data: IResponseToken = await response.json();
        this.ACCESS_TOKEN = data.access_token;

        return data;
    }

    public async generateSignature(
        httpMethod: string,
        urlPath: string,
        accessToken: string,
        body: any,
        timeStamp: string
    ): Promise<string> {
        const bodyHash = await this.hash(body);
        const stringToSign = `${httpMethod}:${urlPath}:${accessToken}:${bodyHash}:${timeStamp}`;

        return crypto
            .createHmac("sha256", this.API_KEY_SECRET)
            .update(stringToSign)
            .digest("hex");
    }

    private async hash(data: any): Promise<string> {
        if (data === null || data === undefined) {
            data = "";
        } else if (typeof data === "object") {
            data = JSON.stringify(data);
        } else {
            data = String(data);
        }

        return crypto
            .createHash("sha256")
            .update(data.replace(/\s/g, ""))
            .digest("hex");
    }

    private encodeAuthorization(): string {
        return Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString(
            "base64"
        );
    }
}
