import { runCode } from "../controllers/ideController.js";
import { Router } from "express";

export const ideRouter = Router();

ideRouter.post('/', runCode);
