import { Router } from "express";
import User from "../models/userModel.js";
import { doHash } from "../utils/hasing.js";
import { genSalt } from "bcryptjs";
// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("role_id", "role_name")
      .select("-password"); // exclude password

    // Map users to include the correct username
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username || user.email, // <-- use user.username here
      email: user.email,
      role: user.role_id?.role_name || "User",
      status: user.status,
      createdAt: user.createdAt,
    }));

    console.log(formattedUsers); // check backend output
    return res.status(200).json({ users: formattedUsers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
}

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .populate("role_id", "role_name")
      .select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedUser = {
      id: user._id,
      username: user.username || user.email,
      email: user.email,
      role: user.role_id?.role_name || "User",
      status: user.status,
      createdAt: user.createdAt,
    };

    return res.status(200).json({ user: formattedUser });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
}



// Change User Password
export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const salt = await genSalt(10);
    const hashedPassword = await doHash(newPassword, salt);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true } // optional: returns updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return res.status(500).json({
      message: "Error changing user password",
      error: error.message,
    });
  }
};

// Change user status to blocked or unblocked
export const changeUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id || req.body.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: status },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    return res.status(200).json({ message: `User ${status ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: "Error changing user status", error: error.message });
  }
};

// // Block user
// export const blockUser = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       { status: true },
//       { new: true }
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     return res.status(200).json({ message: "User blocked successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error blocking user", error: error.message });
//   }
// };

// // Unblock user
// export const unblockUser = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       { status: false },
//       { new: true }
//     ).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     return res.status(200).json({ message: "User unblocked successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error unblocking user", error: error.message });
//   }
// };

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};


export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    console.log("Change role request:", { id, role_id }); // <--- log it

    if (!role_id) {
      return res.status(400).json({ message: "role Id is required" })
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role_id },
      { new: true }
    ).populate("role_id", "role_name");

    if (!updatedUser) {
      return res.status(404).json({ message: "user not found" })
    } 

    return res.status(200).json({
      message: "User role changed successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error in changeUserRole:", error);
    res.status(500).json({ message: "Error changing user role", error: error.message });
  }
}
