import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8293804151:AAFMqOjopolwou4BLorFXzLxz733juL1pCg";
const CHAT_ID = "-1003053708629";

export const sendTelegramNotification = async (message) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram bot token not configured');
      return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    console.log('Telegram notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error.message);
  }
};

export const sendEnrollmentNotification = async (userInfo, courseInfo, enrollmentInfo) => {
  // Only send notification if payment status is 'paid'
  if (enrollmentInfo.payment_status !== 'paid') {
    console.log('Skipping Telegram notification - payment status is pending');
    return;
  }

  const message = `
🎓 <b>New Course Enrollment!</b>

👤 <b>Student:</b> ${userInfo.username || userInfo.email}
📧 <b>Email:</b> ${userInfo.email}

📚 <b>Course:</b> ${courseInfo.course_title}
💰 <b>Price:</b> $${courseInfo.course_price || 0}
💳 <b>Payment Status:</b> ${enrollmentInfo.payment_status.toUpperCase()}

📅 <b>Enrolled At:</b> ${new Date(enrollmentInfo.enrolled_at).toLocaleString()}

✅ Payment completed
  `;

  await sendTelegramNotification(message);
};
