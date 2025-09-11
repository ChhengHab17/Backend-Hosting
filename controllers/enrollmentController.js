import Enrollment from "../models/enrollmentModel.js";
import Course from "../models/courseModel.js";
import User from "../models/userModel.js";
import { sendEnrollmentNotification } from "../utils/telegramService.js";

export const getAllEnrollments = async (req, res) => {
        try {
            const enrollments = await Enrollment.find();
            res.json(enrollments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

export const enrollUser = async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    console.log(user_id, course_id);

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    let enrollment = await Enrollment.findOne({ user_id, course_id });
    let isNewEnrollment = false;

    // Check if user already has access (either enrolled or free course)
    if (enrollment) {
      // User already enrolled
      return res.status(200).json({
        data: { enrollment, course }, 
        success: true,
        message: "User already enrolled"
      });
    }

    // For free courses, grant immediate access without saving enrollment
    if (course.course_price === 0) {
      return res.status(200).json({ 
        code: "free", 
        success: true,
        message: "Free course - access granted",
        data: { course, hasAccess: true }
      });
    }

    // For paid courses, create enrollment with pending payment
    isNewEnrollment = true;
    enrollment = new Enrollment({
      user_id,
      course_id,
      progress_status: 0,
      payment_status: "pending",
    });
    
    enrollment = await enrollment.save();

    // Send Telegram notification for new paid course enrollments
    try {
      const user = await User.findById(user_id);
      if (user) {
        await sendEnrollmentNotification(user, course, enrollment);
      }
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
      // Don't fail the enrollment if Telegram notification fails
    }

    res.status(200).json({
      data: { enrollment, course }, 
      success: true,
      message: "Enrollment created - payment pending"
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "User is already enrolled in this course" });
    }
    res.status(500).json({ error: error.message });
  }
};//get all of user course
export const getUserEnrollments = async (req, res) => {
    try {
        const { id } = req.params;
        const enrollments = await Enrollment.find({ user_id: id })
            .populate({
              path: 'course_id',
              select: 'course_title course_description image category',
              populate: {
                path: 'category_id',
                select: 'category_name'
              }
            })
            .populate('user_id', 'username email');
        
        const formattedData = enrollments.map(enrollment => ({
            ...enrollment.toObject(),
            course: enrollment.course_id,
            user: enrollment.user_id
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const { user_id, course_id, progress_status } = req.body;
        const enrollment = await Enrollment.findOne({ user_id, course_id });
        if (!enrollment) {
            return res.status(404).json({ error: "Enrollment not found" });
        }
        enrollment.progress_status = progress_status;
        const updatedEnrollment = await enrollment.save();
        res.json(updatedEnrollment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
}

export const deleteEnrollment = async (req, res) => {
    try {
        const { user_id, course_id } = req.params;
        const enrollment = await Enrollment.findOneAndDelete({ user_id, course_id });
        if (!enrollment) {
            return res.status(404).json({ error: "Enrollment not found" });
        }
        res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const markEnrollPaid = async ( req, res) => {
    try {
    const { user_id, course_id } = req.body;

    const enrollment = await Enrollment.findOne({ user_id, course_id });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    enrollment.payment_status = "paid";
    await enrollment.save();

    // Send Telegram notification for payment completion
    try {
      const [user, course] = await Promise.all([
        User.findById(user_id),
        Course.findById(course_id)
      ]);
      
      if (user && course) {
        await sendEnrollmentNotification(user, course, enrollment);
      }
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
      // Don't fail the payment update if Telegram notification fails
    }

    res.status(200).json({ success: true, enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

//get all of paid enrollments
export const getPaidEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ payment_status: "paid" })
            .populate('course_id', 'course_title course_description image')
            .populate('user_id', 'username email');
        
        const formattedData = enrollments.map(enrollment => ({
            ...enrollment.toObject(),
            course: enrollment.course_id,
            user: enrollment.user_id
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};