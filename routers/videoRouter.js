import express from "express";
import {
    createVideo,
    updateVideo,
    deleteVideo,
    getVideoById,
    getVideoByLessonId,
    getVideosByCourseId,
    getAllVideos
} from "../controllers/videoController.js";

export const videoRouter = express.Router();

videoRouter.post("/", createVideo);                           // Create video
videoRouter.get("/", getAllVideos);                          // Get all videos
videoRouter.get("/:id", getVideoById);                       // Get video by ID
videoRouter.patch("/:id", updateVideo);                      // Update video
videoRouter.delete("/:id", deleteVideo);                     // Delete video
videoRouter.get("/lesson/:lessonId", getVideoByLessonId);    // Get videos by lesson ID
videoRouter.get("/course/:courseId", getVideosByCourseId);   // Get videos by course ID

export default videoRouter;