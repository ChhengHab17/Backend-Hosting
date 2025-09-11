import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
{
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  sub_title: {
    type: String,
    required: false
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
});

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;