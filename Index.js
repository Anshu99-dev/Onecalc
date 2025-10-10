const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

let otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "your.email@gmail.com", // 👈 Apna Gmail
    pass: process.env.GMAIL_PASS || "your_app_password",    // 👈 App Password (not normal password)
  },
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name & Email required" });

  const otp = generateOtp();
  const expiryTime = Date.now() + 5 * 60 * 1000;
  otpStore[email] = { otp, expiryTime };

  try {
    await transporter.sendMail({
      from: "HopWeb <your.email@gmail.com>",
      to: email,
      subject: "HopWeb OTP Verification",
      html: `<p>Hello ${name},</p><p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });
    res.json({ success: true, message: "OTP sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!otpStore[email]) return res.status(400).json({ error: "No OTP requested for this email" });

  const stored = otpStore[email];
  if (Date.now() > stored.expiryTime) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP expired" });
  }

  if (otp === stored.otp) {
    delete otpStore[email];
    return res.json({ success: true, message: "OTP verified!" });
  } else {
    return res.status(400).json({ error: "Invalid OTP" });
  }
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
