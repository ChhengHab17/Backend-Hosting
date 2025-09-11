import jwt from "jsonwebtoken";
import Role from "../models/roleModels.js";

export const identifier = (req, res, next) => {
  let token = req.headers.authorization || req.cookies["Authorization"];

  if (!token) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  try {
    const userToken = token.split(" ")[1];
    const jwtVerified = jwt.verify(userToken, process.env.JWT_SECRET || process.env.TOKEN_SECRET);

    if (jwtVerified) {
      req.user = jwtVerified;
      next();
    } else {
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.log(error);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

export const isAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        
        // Handle both old format (role_id as object) and new format (role_id as string)
        let roleId = user.role_id;
        if (typeof roleId === 'object' && roleId._id) {
          roleId = roleId._id;
        }
        
        const role = await Role.findById(roleId);
        console.log(user);
        console.log(role);
        
        if (!role || role.role_name !== "admin") {
          return res.status(403).json({ message: "Require Admin Role!" });
        }
 
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const isUser = async (req, res, next) => {
    try {
        const user = req.user;
        
        // Handle both old format (role_id as object) and new format (role_id as string)
        let roleId = user.role_id;
        if (typeof roleId === 'object' && roleId._id) {
          roleId = roleId._id;
        }
        
        const role = await Role.findById(roleId);
        console.log(user);
        console.log(role);
        
        if (!role || role.role_name !== "user") {
          return res.status(403).json({ message: "Require User Role!" });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};