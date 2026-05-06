const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('--- Email Test Script ---');
  console.log('User:', process.env.EMAIL_USER);
  console.log('Pass:', process.env.EMAIL_PASS ? '********' : 'MISSING');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log('Attempting to send test email...');
    const info = await transporter.sendMail({
      from: `"KrishiConnect Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self
      subject: "KrishiConnect Email Facility Test",
      text: "If you are reading this, your Nodemailer configuration is correct! 🌾",
      html: "<h1>✅ Email Working!</h1><p>Your KrishiConnect email facility is now fully operational.</p>",
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Check your inbox at:', process.env.EMAIL_USER);
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

testEmail();
