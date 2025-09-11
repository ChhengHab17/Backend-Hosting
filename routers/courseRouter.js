import express from "express";
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCoursesByCategoryId,
    getCoursesByCategoryName
} from "../controllers/courseController.js";
export const courseRouter = express.Router();

courseRouter.post("/", createCourse);           // Create a new course
courseRouter.get("/", getAllCourses);           // Get all courses
courseRouter.get("/:id", getCourseById);        // Get a single course by ID
courseRouter.patch("/:id", updateCourse);       // Update a course
courseRouter.delete("/:id", deleteCourse);      // Delete a course
courseRouter.get("/category/:categoryId", getCoursesByCategoryId);
courseRouter.get("/category/name/:categoryName", getCoursesByCategoryName);   // Get courses by category name