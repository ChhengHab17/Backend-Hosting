// controllers/dashboardController.js
import User from "../models/userModel.js";
import Course from "../models/courseModel.js";
import Enrollment from "../models/enrollmentModel.js";

// Helper function to calculate growth %
const calcGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0; // avoid division by zero
  return ((current - previous) / previous) * 100;
};

export const getDashboardStats = async (req, res) => {
  try {
    // === USERS ===
    const totalUsers = await User.countDocuments();

    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfThisMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfThisMonth }
    });

    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
    });

    const usersGrowth = calcGrowth(usersThisMonth, usersLastMonth).toFixed(1);

    // === COURSES ===
    const totalCourses = await Course.countDocuments();

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newCoursesThisWeek = await Course.countDocuments({ createdAt: { $gte: lastWeek } });

    // === ENROLLMENTS ===
    const totalEnrollments = await Enrollment.countDocuments({ payment_status: "paid" });
    const enrollmentsLastMonth = await Enrollment.countDocuments({ 
      payment_status: "paid",
      createdAt: { $lt: new Date(), $gte: startOfLastMonth } 
    });

    // === ACTIVE USERS TODAY ===
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeUsersToday = await User.countDocuments({ lastLogin: { $gte: today } });

    // === NEW SIGNUPS THIS WEEK ===
    const newSignups = await User.countDocuments({ createdAt: { $gte: lastWeek } });

    // === COMPLETION RATE ===
    const totalCompletedEnrollments = await Enrollment.countDocuments({ 
      payment_status: "paid",
      progress_status: 100 
    });
    const completionRate =
      totalEnrollments === 0
        ? 0
        : Math.round((totalCompletedEnrollments / totalEnrollments) * 100);

    // === INCOME ANALYTICS ===
    // Today's income
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEnrollments = await Enrollment.find({
      payment_status: "paid",
      enrolled_at: { $gte: todayStart, $lte: todayEnd }
    }).populate('course_id', 'course_price');

    const todayIncome = todayEnrollments.reduce((total, enrollment) => {
      return total + (enrollment.course_id?.course_price || 0);
    }, 0);

    // This week's income
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnrollments = await Enrollment.find({
      payment_status: "paid",
      enrolled_at: { $gte: weekStart }
    }).populate('course_id', 'course_price');

    const weekIncome = weekEnrollments.reduce((total, enrollment) => {
      return total + (enrollment.course_id?.course_price || 0);
    }, 0);

    // This month's income
    const monthEnrollments = await Enrollment.find({
      payment_status: "paid",
      enrolled_at: { $gte: startOfThisMonth }
    }).populate('course_id', 'course_price');

    const monthIncome = monthEnrollments.reduce((total, enrollment) => {
      return total + (enrollment.course_id?.course_price || 0);
    }, 0);

    // Last month's income for growth calculation
    const lastMonthEnrollments = await Enrollment.find({
      payment_status: "paid",
      enrolled_at: { $gte: startOfLastMonth, $lt: startOfThisMonth }
    }).populate('course_id', 'course_price');

    const lastMonthIncome = lastMonthEnrollments.reduce((total, enrollment) => {
      return total + (enrollment.course_id?.course_price || 0);
    }, 0);

    const incomeGrowth = calcGrowth(monthIncome, lastMonthIncome).toFixed(1);

    // Daily income for last 7 days
    const dailyIncome = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEnrollments = await Enrollment.find({
        payment_status: "paid",
        enrolled_at: { $gte: dayStart, $lte: dayEnd }
      }).populate('course_id', 'course_price');

      const dayRevenue = dayEnrollments.reduce((total, enrollment) => {
        return total + (enrollment.course_id?.course_price || 0);
      }, 0);

      dailyIncome.push({
        date: dayStart.toISOString().split('T')[0],
        income: dayRevenue
      });
    }
    
    // === Monthly stats for last 6 months ===
    const now = new Date();
    const monthlyStats = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const enrollments = await Enrollment.countDocuments({
        payment_status: "paid",
        enrolled_at: { $gte: start, $lt: end },
      });
      const users = await User.countDocuments({
        createdAt: { $gte: start, $lt: end },
      });

      const monthName = start.toLocaleString("default", { month: "short" });
      monthlyStats.push({ month: monthName, enrollments, users });
    }

    // === COURSE DISTRIBUTION FOR PIE CHART ===
    const courses = await Course.find({});
    const courseDistribution = await Promise.all(
      courses.map(async (course, index) => {
        const enrollmentsCount = await Enrollment.countDocuments({ 
          course_id: course._id,
          payment_status: "paid" 
        });
        return {
          name: course.course_title, // display the actual course title
          value: enrollmentsCount,   // number of enrollments
          color: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280"][index % 6],
        };
      })
    );  

    res.json({
      totalUsers,
      usersGrowth, // ✅ fixed to use month-to-month comparison
      totalCourses,
      newCoursesThisWeek,
      totalEnrollments,
      enrollmentsGrowth: calcGrowth(totalEnrollments, enrollmentsLastMonth).toFixed(1),
      activeUsersToday,
      newSignups,
      completionRate,
      // Income analytics
      todayIncome,
      weekIncome,
      monthIncome,
      incomeGrowth,
      dailyIncome,
      monthlyStats,
      courseDistribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

