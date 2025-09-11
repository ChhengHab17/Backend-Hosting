import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total_questions: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    answers: [{
      question_index: { type: Number, required: true },
      selected_options: [{ type: Number, required: true }],
      correct_options: [{ type: Number, required: true }],
      is_correct: { type: Boolean, required: true },
    }],
    attempt_number: {
      type: Number,
      required: true,
      default: 1,
    },
    highest_score: {
      type: Number,
      required: true,
      min: 0,
    },
    highest_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    highest_passed: {
      type: Boolean,
      required: true,
    },
  },
  { 
    timestamps: true
  }
);

// Create unique compound index to ensure only one attempt per user per course
quizAttemptSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

// Additional indexes for faster queries
quizAttemptSchema.index({ quiz_id: 1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
