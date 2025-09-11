import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
      username: {
          type: String,
          required: [true, "Username is required"],
          trim: true,
      },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: [true, "email must be unique"],
      minLengeth: [5, "Email must be at least 5 characters long"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      select: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: String,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
    lastLogin: { type: Date, default: null }
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
