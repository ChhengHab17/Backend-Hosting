from fastapi import FastAPI
from pydantic import BaseModel
import random
from bakong_khqr import KHQR
import os

token = os.environ.get("BAKONG_ACCESS_TOKEN")

app = FastAPI()

# Create KHQR instance once when the server starts
khqr = KHQR(token)

# Input schema
class QRRequest(BaseModel):
    bank_account: str = "te_chhenghab@aclb"
    merchant_name: str = "Online Course"
    merchant_city: str = "Phnom Penh"
    amount: float
    currency: str = "KHR"
    store_label: str = "Online Course"
    phone_number: str = "85585413766"
    bill_number: str = None  # generate dynamically
    terminal_label: str = "Cashier"
    static: bool = False


@app.post("/generate-qr")
def generate_qr(data: QRRequest):
    bill_number = str(random.randint(1, 1000))
    qr = khqr.create_qr(
        bank_account=data.bank_account,
        merchant_name=data.merchant_name,
        merchant_city=data.merchant_city,
        amount=data.amount,
        currency=data.currency,
        store_label=data.store_label,
        phone_number=data.phone_number,
        bill_number=bill_number,
        terminal_label=data.terminal_label,
        static=data.static
    )

    md5 = khqr.generate_md5(qr=qr)

    # Save QR image

    khqr_image =khqr.qr_image(qr=qr, format="base64_uri")

    return {
        "md5": md5,
        "base64" : khqr_image
    }

@app.get("/check-payment/{md5}")
def check_payment(md5: str):
    result = khqr.check_payment(md5=md5)
    return result
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)