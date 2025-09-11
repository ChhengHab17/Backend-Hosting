import Category from "../models/categoryModel.js";

export const createCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getAllcategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json(category);
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateCategory = async (req, res) => {
    try{
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json(updatedCategory);
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json({ message: "Category deleted successfully" });
    }catch (error) {
        res.status(400).json({ message: error.message });
    }
}
