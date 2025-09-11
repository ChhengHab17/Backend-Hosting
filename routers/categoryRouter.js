import express from "express";
import {
    createCategory,
    getAllcategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from "../controllers/categoryController.js";
export const categoryRouter = express.Router();

categoryRouter.post("/", createCategory);
categoryRouter.get("/", getAllcategories);
categoryRouter.get("/:id", getCategoryById);
categoryRouter.patch("/:id", updateCategory);
categoryRouter.delete("/:id", deleteCategory);