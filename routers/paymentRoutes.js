import {Router} from 'express';
import {generateQr, verifyQr} from "../controllers/paymentQR.js";

export const paymentRouter = Router();

paymentRouter.post("/generate", generateQr);
paymentRouter.post("/verify", verifyQr);

