import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  course_title: {
    type: String,
    required: [true, "Course title is required"],
  },
  image: {
    type: String,
  },
  course_description: {
    type: String,
    required: [true, "Course description is required"],
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  course_price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  language: {
    type: String,
    required: true,
  },
  isFree: {
    type: Boolean,
    required: true,
    default: true,
  }
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);
export default Course;
