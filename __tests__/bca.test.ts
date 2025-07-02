import * as dotenv from "dotenv";
import BCA from "../lib/bca";
dotenv.config();
// import ForexRate from "../lib/forexRate";

const bcaService = new BCA();

it("Should generate new access token", async () => {
    const { access_token } = await bcaService.generateToken();
    expect(access_token).toBeDefined();
});

it("Should generate Expired In", async () => {
    const { expires_in } = await bcaService.generateToken();
    // console.log("Token", expires_in);
    expect(expires_in).toBe(3600);
});

// it("Should get forex rate information", async () => {
//     const getForex = new ForexRate().main();

//     const res = await getForex
//         .then((result) => {
//             return result;
//         })
//         .catch((error) => {
//             return error;
//         });

//     expect(res.status).toBe(200);
//     expect(res.data.Currencies).toBeDefined();
// });
