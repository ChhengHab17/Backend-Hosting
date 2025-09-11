import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
{
  course_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  lesson_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true
  },
  title: { 
    type: String, 
    required: false 
  },
  description: { 
    type: String, 
    required: false
  },
  url: { 
    type: String, 
    required: true 
  },
});

const Video = mongoose.model("Video", videoSchema);

export default Video;