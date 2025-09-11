import express from "express";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizById,
  getQuizByCourseId,
  deleteQuizQuestion, 
  deleteQuizOption,
  submitQuiz,
  getUserQuizAttempts,
  getUserLatestQuizAttempt,
  checkQuizCompletion
} from "../controllers/quizController.js";

export const quizRouter = express.Router();

// Create quiz
quizRouter.post("/", createQuiz);

// Update quiz by ID
quizRouter.patch("/:id", updateQuiz);

// Delete quiz by ID
quizRouter.delete("/:id", deleteQuiz);

// Get quiz by ID
quizRouter.get("/:id", getQuizById);

// Get quiz by course ID
quizRouter.get("/course/:courseId", getQuizByCourseId);

// Submit quiz
quizRouter.post("/submit/:courseId", submitQuiz);

// Get user quiz attempts
quizRouter.get("/attempts/:courseId/:userId", getUserQuizAttempts);

// Get user's latest quiz attempt
quizRouter.get("/latest/:courseId/:userId", getUserLatestQuizAttempt);

// Check quiz completion status
quizRouter.get("/completion/:courseId/:userId", checkQuizCompletion);

// Delete question and option routes
quizRouter.delete("/:id/question/:questionId", deleteQuizQuestion);
quizRouter.delete("/:id/question/:questionId/option/:optionId", deleteQuizOption);

export default quizRouter;
