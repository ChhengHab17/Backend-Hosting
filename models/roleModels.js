import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    role_name: {
        type: String,
        require: true,
        unique: true,
        enum: ["user", "admin"],
        default: "user",
    }
})

export default mongoose.model("Role", roleSchema);