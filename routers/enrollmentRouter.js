import { enrollUser, getAllEnrollments, getUserEnrollments, deleteEnrollment, updateProgress, markEnrollPaid, getPaidEnrollments} from "../controllers/enrollmentController.js";
import { Router } from "express";

export const enrollmentRouter = Router();

enrollmentRouter.post("/", enrollUser);
enrollmentRouter.get("/", getAllEnrollments);
enrollmentRouter.get("/user/:id", getUserEnrollments);
enrollmentRouter.get("/paid", getPaidEnrollments);
enrollmentRouter.delete("/:user_id/:course_id", deleteEnrollment);
enrollmentRouter.patch("/", updateProgress);
enrollmentRouter.patch("/mark-paid", markEnrollPaid);
