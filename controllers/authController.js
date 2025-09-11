import { tranport } from "../middlewares/sendMail.js";
import {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptforgotPasswordCodeSchema,
  forgotPasswordSchema
} from "../middlewares/validator.js";
import User from "../models/userModel.js"; // Assuming you have a User model defined
import Role from "../models/roleModels.js";
import { doHash, doHashValidation, hmacProcess } from "../utils/hasing.js"; // Assuming you have a hashing utility function
import jwt from "jsonwebtoken"; // Assuming you are using JWT for authentication

export const signup = async (req, res) => {
  const {username, email, password } = req.body;
  console.log("data",req.body);
  try {
    const { error, value } = signupSchema.validate({ username, email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is already resgistered" });
    }

    const hashedPassword = await doHash(password, 12);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    const role = await Role.findOne({ role_name: "user" });
    newUser.role_id = [role._id];

    const result = await newUser.save();
    result.password = undefined;

    res.json({
      success: true,
      message: "Account created successfully",
      result,
    });
  } catch (error) {
    console.log(error);
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password +lastLogin").populate( "role_id", "-__v");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is not registered yet!" });
    }
    // Check if verified
    
    const result = await doHashValidation(password, existingUser.password);
    console.log(password, existingUser.password);
    console.log(result);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Password is incorrect!" });
    }
    if (!existingUser.verified) {
      return res.status(200).json({
        success: false,
        message: "You are not verified yet!",
        email: existingUser.email // so frontend knows which email to prefill
      });
    }
    if(existingUser.status){
      return res.status(200).json({
        success: false,
        message: "Your account is suspended!",
        email: existingUser.email // so frontend knows which email to prefill
      });
    }
    existingUser.lastLogin = new Date();
    await existingUser.save();
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
        verified: existingUser.verified,
        role_id: existingUser.role_id
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "8h",
      }
    );
    console.log(existingUser);
    // Extract user roles
    const authorities = [`ROLE_${existingUser.role_id.role_name.toUpperCase()}`];

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
    console.log(error);
  }
};
export const signout = async (req, res) => {
  res.clearCookie("Authorization").status(200).json({
    success: true,
    message: "Signout successfully",
  });
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email is not registered yet!",
      });
    }
    if (existingUser.verified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified!",
      });
    }
    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await tranport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Email Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e9ecef;">
              <h1 style="color: #333; margin: 0; font-size: 28px;">E-Learning Platform</h1>
            </div>
            
            <div style="padding: 30px 20px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Email Verification</h2>
              <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
                Thank you for signing up! Please use the verification code below to complete your registration:
              </p>
              
              <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 30px; margin: 30px 0;">
                <div style="font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${codeValue}
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This code will expire in <strong>5 minutes</strong> for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you didn't request this verification, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 12px;">
              <p style="margin: 0;">© 2024 E-Learning Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code Sent",
      });
    }
    res.status(400).json({
      success: true,
      message: "Code Sent failed",
    });
  } catch (error) {
    console.log(error);
  }
};

export const verifyCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is not registered yet!" });
    }
    if (existingUser.verified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified!",
      });
    }
    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code" });
    }
    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: "Code is expired, please request a new code",
      });
    }
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    const token = jwt.sign(
        {
          userId: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          verified: existingUser.verified,
          role_id: existingUser.role_id
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: '8h',
        }
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      }).json({
        success: true,
        token,
        message: "Email is verified successfully",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Code is incorrect",
    });
  } catch (error) {
    console.log(error);
  }
};

export const changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "You are not verified yet!",
      });
    }
    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "User is not exist",
      });
    }
    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credential" });
    }
    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

export const sendForgotPasswordCode = async (req, res) => {
  console.log("Incoming request body:", req.body);
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email is not registered yet!",
      });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();

    let info = await tranport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Password Reset Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e9ecef;">
              <h1 style="color: #333; margin: 0; font-size: 28px;">E-Learning Platform</h1>
            </div>
            
            <div style="padding: 30px 20px; text-align: center;">
              <h2 style="color: #dc3545; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
              <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
                We received a request to reset your password. Please use the code below to proceed:
              </p>
              
              <div style="background-color: #fff5f5; border: 2px dashed #dc3545; border-radius: 8px; padding: 30px; margin: 30px 0;">
                <div style="font-size: 36px; font-weight: bold; color: #dc3545; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${codeValue}
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This code will expire in <strong>5 minutes</strong> for security reasons.
              </p>
              
              <p style="color: #dc3545; font-size: 14px; margin-top: 20px; font-weight: bold;">
                If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 12px;">
              <p style="margin: 0;">© 2024 E-Learning Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code Sent",
      });
    }
    res.status(400).json({
      success: true,
      message: "Code Sent failed",
    });
  } catch (error) {
    console.log(error);
  }
};

export const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = acceptforgotPasswordCodeSchema.validate({
      email,
      providedCode,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Email is not registered yet!" });
    }
    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code" });
    }
    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Code is expired, please request a new code",
      });
    }
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: "Code verify successfully",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Code is incorrect",
    });
  } catch (error) {
    console.log(error);
  }
};
export const resetPassword = async (req, res) => {
  const { email , password } = req.body;

  try {
    const { error, value } = forgotPasswordSchema.validate({
      email,
      password,
    });
    if (error) {
      return res
          .status(401)
          .json({ success: false, message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email }).select(
        "+password"
    );
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "User is not exist",
      });
    }

    const hashedPassword = await doHash(password, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error);
  }

}
