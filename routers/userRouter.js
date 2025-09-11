import express from "express";
import {
    // blockUser,
    // unblockUser,
    deleteUser,
    getAllUsers,
    getUserById,
    changeUserStatus,
    changeUserPassword,
    changeUserRole
} from "../controllers/userController.js";
export const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
// userRouter.patch("/block/:id", blockUser);  
// userRouter.patch("/unblock/:id", unblockUser);
userRouter.delete("/:id", deleteUser);
userRouter.patch("/:id", changeUserStatus);
userRouter.patch("/change-password/:id", changeUserPassword);
userRouter.patch("/change-role/:id", changeUserRole);


export default userRouter;
