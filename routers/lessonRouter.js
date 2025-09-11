import express from "express";
import {
	createLesson,
	updateLesson,
	deleteLesson,
	getLessonById,
	getAllLessons
} from "../controllers/lessonController.js";

export const lessonRouter = express.Router();

lessonRouter.post("/", createLesson);
lessonRouter.get("/", getAllLessons);
lessonRouter.get("/:id", getLessonById);
lessonRouter.patch("/:id", updateLesson);
lessonRouter.delete("/:id", deleteLesson);

export default lessonRouter;