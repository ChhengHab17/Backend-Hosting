import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    enrolled_at: {
        type: Date,
        default: Date.now,
    },
    progress_status: {
        type: Number,
        default: 0,
        max: 100,
    },
    payment_status: {
        type: String,
        enum: ["paid", "pending"],
        default: "pending",
    },
});
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
export default mongoose.model("Enrollment", enrollmentSchema);
