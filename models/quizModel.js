import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    question_text: { type: String, required: true },

    // type of question
    question_type: {
      type: String,
      enum: ["single", "multiple", "truefalse"],
      required: true,
    },

    // possible answers
    options: {
      type: [optionSchema],
      validate: {
        validator: function (opts) {
          if (this.question_type === "single" && opts.length !== 4) {
            return false; // must be exactly 4
          }
          if (this.question_type === "multiple" && opts.length < 4) {
            return false; // at least 4, can be more
          }
          if (this.question_type === "truefalse" && opts.length !== 2) {
            return false; // exactly 2
          }
          return true;
        },
        message:
          "Invalid number of options: single requires 4, multiple requires at least 4, truefalse requires 2.",
      },
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
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
    description: {
      type: String,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
