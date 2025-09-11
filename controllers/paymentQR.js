import {BakongKHQR, khqrData, IndividualInfo, SourceInfo, MerchantInfo} from "bakong-khqr";
import axios from "axios";

export const generateQr = async (req, res) => {
  try {
    const { currency, amount } = req.body;

    // Data to send to the Python service
    const payload = {
      bank_account: "te_chhenghab@aclb",
      merchant_name: "Online Course",
      merchant_city: "Phnom Penh",
      amount: amount,
      currency: currency,
      store_label: "Online Course",
      phone_number: "85585413766",
      terminal_label: "Terminal",
      static: false
    };

    // Call Python FastAPI microservice
    const pythonResponse = await axios.post(
      "http://127.0.0.1:8001/generate-qr",
      payload
    );

    const { md5, base64 } = pythonResponse.data;

    return res.json({
      success: true,
      data: {
        md5,
        base64
      }
    });
  } catch (err) {
    console.error("Error generating QR via Python service:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate QR",
      error: err.message
    });
  }
};

export const verifyQr = async (req, res) => {
  try {
    const { md5 } = req.body;

    const response = await axios.post(
      "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5",
      { md5 },
      { headers: { Authorization: `Bearer ${process.env.BAKONG_ACCESS_TOKEN}` } }
    );

    console.log(response.data); // Debug only
    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Error verifying KHQR:", error);
    return res.status(500).json({ success: false, message: "Failed to verify QR" });
  }
};

// export const generateDeeplinkFunc = async (req, res) => {
//   try {
//     // const khqr = new BakongKHQR();
//     // const sourceInfo = new SourceInfo(
//     //     "https://play-lh.googleusercontent.com/GguSSKNcZdGw624xa9VqH71Sy6B12bHdlINY0RN_CltpzE51NgdFWkxesZuI4joVDrM",
//     //     "Online Course",
//     //     "http://localhost:5173/payment",
//     // )
//     const qr = "00020101021230500017te_chhenghab@aclb011012345678900211XXXXKHPPXXX520459995303116540410005802KH5913Online Course6010Phnom Penh62560105#00010211855854137660313Online Course0711Terminal 01993400131756361769584011317563620695836304E28F";
//     const response = await axios.post(
//         "https://api-bakong.nbc.gov.kh/v1/generate_deeplink_by_qr",
//         { qr: qr },
//         { headers: { Authorization: `Bearer ${process.env.BAKONG_ACCESS_TOKEN}` } }
//         );
//     console.log(response);
//     return res.json({ success: true, data: response.data });
//   }catch(error){
//     console.error("Error generating KHQR:", error);
//     return res.status(500).json({ success: false, message: "Failed to generate QR" });
//   }
// }

