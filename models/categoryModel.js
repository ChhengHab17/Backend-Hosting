import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
    {

        category_name:{
            type: String,
            required: [true, "Category name is required"]
        },
        
    }
)
const Category = mongoose.model("Category", categorySchema);
export default Category;