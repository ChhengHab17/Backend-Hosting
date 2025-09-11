import express from "express";
import { identifier, isAdmin, isUser } from "../middlewares/authMiddleware.js";
import {
  signup,
  signin,
  signout,
  sendVerificationCode,
  verifyCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPassword,
} from "../controllers/authController.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // Add this import
import Role from "../models/roleModels.js"; // Add this import
import { doHash } from "../utils/hasing.js"; // Add this import
import { genSalt } from "bcryptjs"; // Add this import

export const router = express.Router();

// Initialize Google client with better error handling
let googleClient;
try {
  if (process.env.GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
} catch (error) {
  console.error("Google OAuth client initialization failed:", error);
}

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);
router.patch("/verification-code", sendVerificationCode);
router.patch("/verify-code", verifyCode);
router.patch("/change-password", changePassword);
router.patch("/send-forgotPassword", sendForgotPasswordCode);
router.patch("/verify-forgotPassword", verifyForgotPasswordCode);
router.patch("/change-forgot-password", resetPassword);

// Updated Google sign-in with account linking for existing users
router.post("/google-signin", async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ success: false, message: "Missing idToken" });
  }

  if (!googleClient) {
    return res.status(500).json({ 
      success: false, 
      message: "Google authentication not configured" 
    });
  }

  try {
    console.log("Verifying Google token with client ID:", process.env.GOOGLE_CLIENT_ID);
    console.log("Token preview:", idToken.substring(0, 100) + "...");
    
    // Try verification with multiple possible audiences
    const clientId = process.env.GOOGLE_CLIENT_ID;
    let ticket;
    
    try {
      // Primary verification
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch (primaryError) {
      console.log("Primary verification failed, trying with .apps.googleusercontent.com suffix");
      
      // If client ID doesn't end with .apps.googleusercontent.com, try adding it
      const fullClientId = clientId.endsWith('.apps.googleusercontent.com') 
        ? clientId 
        : `${clientId}.apps.googleusercontent.com`;
        
      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: fullClientId,
        });
      } catch (secondaryError) {
        console.error("Both verification attempts failed:");
        console.error("Primary error:", primaryError.message);
        console.error("Secondary error:", secondaryError.message);
        throw primaryError; // Throw the original error
      }
    }

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const googleId = payload.sub;
    const emailVerified = payload.email_verified;

    console.log("Google user info:", { email, name, googleId, emailVerified });

    // Check if email is verified by Google
    if (!emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Google email not verified. Please verify your email with Google first." 
      });
    }

    // Find existing user by email (regardless of how they signed up)
    let user = await User.findOne({ email }).populate("role_id", "role_name");
    
    if (!user) {
      // No existing user - create new Google user
      const userRole = await Role.findOne({ role_name: "user" });
      if (!userRole) {
        return res.status(500).json({ 
          success: false, 
          message: "User role not found in system" 
        });
      }

      // Generate a random password for Google users (they won't use it)
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const salt = await genSalt(10);
      const hashedPassword = await doHash(randomPassword, salt);

      // Create new user for Google sign-in with all required fields
      user = new User({
        username: name || email.split('@')[0], // Use name or email prefix as username
        email,
        password: hashedPassword, // Required field, but user won't use it
        profilePicture: picture,
        googleId,
        verified: true, // Google users are pre-verified
        role_id: userRole._id, // Set proper role_id
        status: false // false = active, true = blocked
      });
      await user.save();
      
      // Populate the role_id for response
      await user.populate("role_id", "role_name");
      console.log("Created new Google user:", user._id);
      
    } else {
      // Existing user found - link Google account to existing account
      console.log("Found existing user with email:", email);
      
      // Check if user account is blocked
      if (user.status) {
        return res.status(403).json({
          success: false,
          message: "Your account is suspended!",
        });
      }
      
      // Link Google account to existing user (one-click linking)
      let userUpdated = false;
      
      if (!user.googleId) {
        user.googleId = googleId;
        userUpdated = true;
        console.log("Linked Google account to existing user");
      }
      
      // Update profile picture if user doesn't have one
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
        userUpdated = true;
        console.log("Updated user profile picture from Google");
      }
      
      // Auto-verify user if they login with Google (Google email is already verified)
      if (!user.verified) {
        user.verified = true;
        userUpdated = true;
        console.log("Auto-verified user via Google login");
      }
      
      // Save updates if any were made
      if (userUpdated) {
        await user.save();
        console.log("Updated existing user:", user._id);
      }
    }

    // Use the same JWT secret as your existing auth system
    const jwtSecret = process.env.TOKEN_SECRET;
    if (!jwtSecret) {
      console.error("TOKEN_SECRET environment variable not found");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error" 
      });
    }

    // Create JWT token with user ID (consistent with regular signin)
    const tokenPayload = { 
      userId: user._id,
      email: user.email,
      username: user.username,
      verified: user.verified,
      role_id: user.role_id
    };
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "8h" }); // Match existing token expiry

    // Extract user roles (consistent with regular signin)
    const authorities = [`ROLE_${user.role_id.role_name.toUpperCase()}`];

    // Set cookie and return response (consistent with regular signin)
    res
      .cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        message: "Login successfully",
        role: authorities
      });

  } catch (error) {
    console.error("Google sign-in error details:", error);
    console.error("Error stack:", error.stack);
    
    // More specific error messages based on error type
    if (error.message?.includes('Token used too early')) {
      return res.status(401).json({ 
        success: false, 
        message: "Token was used too early. Please wait a moment and try again." 
      });
    }
    
    if (error.message?.includes('Token used too late') || error.message?.includes('expired')) {
      return res.status(401).json({ 
        success: false, 
        message: "Token has expired. Please sign in again." 
      });
    }
    
    if (error.message?.includes('Wrong number of segments') || error.message?.includes('Invalid token format')) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token format. Please refresh and try again." 
      });
    }
    
    if (error.message?.includes('Invalid audience')) {
      return res.status(401).json({ 
        success: false, 
        message: "Token audience mismatch. Please check your Google OAuth configuration." 
      });
    }
    
    if (error.message?.includes('Invalid issuer')) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token issuer. Please try signing in again." 
      });
    }
    
    // Generic error for any other cases
    return res.status(401).json({ 
      success: false, 
      message: `Google authentication failed: ${error.message}. Please try again.` 
    });
  }
});

router.post("/admin", identifier, isAdmin, (req, res) => {
  console.log("Hello from Admin Page");
  return res.json({message: "hello from admin page"})
})