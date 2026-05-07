import nodemailer from "nodemailer";

// Single shared transporter — Gmail service via EMAIL_USER + EMAIL_PASS
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

const sender = () => `"KrishiConnect" <${process.env.EMAIL_USER}>`;
const adminEmail = () => process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

// ─── Profile Creation Request (Buy & Sell) ───────────────────────────────────
export const sendProfileCreationEmail = async (userEmail, role) => {
  const roleLabel = role === "farmer" ? "Farmer" : "Agent";

  try {
    const mailer = getTransporter();

    // 1. Notify user
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "🌾 Profile Request Received — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 20px;text-align:center;">
            <div style="background:rgba(255,255,255,0.2);width:60px;height:60px;border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:30px;">🌾</div>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">KrishiConnect</h1>
            <p style="color:#ecfdf5;margin:8px 0 0;font-size:14px;font-weight:500;opacity:0.9;">India's Premier Agri-Marketplace</p>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;">
            <h2 style="color:#065f46;margin-top:0;font-size:22px;font-weight:700;">Registration Received!</h2>
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
              Hello,<br><br>
              We've received your request to join KrishiConnect as a <strong>${roleLabel}</strong> with <strong>Selling Privileges</strong>. 
            </p>
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:20px;border-radius:12px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
                <strong>Current Status:</strong> <span style="background:#fef3c7;padding:2px 8px;border-radius:99px;font-weight:600;text-transform:uppercase;font-size:11px;">Pending Admin Review</span><br><br>
                Our team is currently verifying your details. This usually takes 12-24 hours. You'll receive another email once your selling privileges are active.
              </p>
            </div>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              In the meantime, you can still use KrishiConnect to browse products and place orders.
            </p>
          </div>
          <div style="background:#f1f5f9;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:500;">© ${new Date().getFullYear()} KrishiConnect · Empowering Bharat's Agriculture</p>
          </div>
        </div>
      `,
    });

    // 2. Notify admin
    await mailer.sendMail({
      from: sender(),
      to: adminEmail(),
      subject: `🔔 New ${roleLabel} Approval Request — ${userEmail}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">🔔 Admin Notification</h1>
          </div>
          <div style="background:#ffffff;padding:36px 40px;">
            <h2 style="color:#1e293b;margin-top:0;">New Selling Request</h2>
            <p style="color:#334155;font-size:15px;line-height:1.7;">
              User <strong>${userEmail}</strong> has applied for <strong>${roleLabel}</strong> selling access.
            </p>
            <p style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin-dashboard" style="background:#1e40af;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">Review in Dashboard →</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] Profile creation emails sent.`);
  } catch (error) {
    console.error("[Email] sendProfileCreationEmail failed:", error.message);
  }
};

// ─── Buy Profile Created Successfully ─────────────────────────────────────────
export const sendBuyProfileEmail = async (userEmail, role) => {
  const roleLabel = role === "farmer" ? "Farmer" : "Agent";

  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "✅ Profile Created Successfully — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 20px;text-align:center;">
            <div style="background:rgba(255,255,255,0.2);width:60px;height:60px;border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:30px;">✅</div>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">KrishiConnect</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;text-align:center;">
            <h2 style="color:#065f46;margin-top:0;font-size:22px;font-weight:700;">Welcome Aboard!</h2>
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
              Your <strong>${roleLabel}</strong> profile has been created successfully. You can now explore the marketplace, add items to your wishlist, and place orders.
            </p>
            <div style="margin:32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace" style="background:#10b981;color:#ffffff;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 6px -1px rgba(16,185,129,0.2);">
                Start Shopping →
              </a>
            </div>
            <p style="color:#64748b;font-size:14px;">If you ever wish to sell on the platform, you can upgrade your profile from your settings.</p>
          </div>
          <div style="background:#f1f5f9;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:500;">© ${new Date().getFullYear()} KrishiConnect</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Buy profile email sent to ${userEmail}.`);
  } catch (error) {
    console.error("[Email] sendBuyProfileEmail failed:", error.message);
  }
};

// ─── Profile Approved ────────────────────────────────────────────────────────
export const sendProfileApprovalEmail = async (userEmail, role) => {
  const roleLabel = role === "farmer" ? "Farmer" : "Agent";
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${role}-dashboard`;

  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "🎉 Selling Privileges Approved! — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:50px 20px;text-align:center;">
            <div style="font-size:64px;margin-bottom:10px;">🎊</div>
            <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:900;letter-spacing:-1px;">You're Approved!</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;text-align:center;">
            <h2 style="color:#065f46;margin-top:0;font-size:22px;font-weight:700;">Ready to Grow Your Business?</h2>
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:30px;">
              Great news! Your request for selling privileges as a <strong>${roleLabel}</strong> has been approved. You can now list your products and reach thousands of buyers.
            </p>
            <div style="margin:32px 0;">
              <a href="${dashboardUrl}" style="background:#059669;color:#ffffff;padding:18px 40px;text-decoration:none;border-radius:14px;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 10px 15px -3px rgba(5,150,105,0.3);">
                Go to Seller Dashboard →
              </a>
            </div>
            <p style="color:#64748b;font-size:14px;font-style:italic;">"Your growth is Bharat's growth. Let's get started!"</p>
          </div>
          <div style="background:#f1f5f9;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:500;">© ${new Date().getFullYear()} KrishiConnect · Empowering Farmers</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Approval email sent to ${userEmail}.`);
  } catch (error) {
    console.error("[Email] sendProfileApprovalEmail failed:", error.message);
  }
};

// ─── Profile Rejected ────────────────────────────────────────────────────────
export const sendProfileRejectionEmail = async (userEmail, role) => {
  const roleLabel = role === "farmer" ? "Farmer" : "Agent";

  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "Update regarding your Selling Request — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#fff1f2;border-radius:24px;overflow:hidden;border:1px solid #fecaca;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
          <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px 20px;text-align:center;">
             <div style="font-size:40px;margin-bottom:10px;">⚠️</div>
             <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Request Update</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;">
            <h2 style="color:#991b1b;margin-top:0;font-size:20px;font-weight:700;">Selling Access Not Approved</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:20px;">
              Thank you for your interest in selling on KrishiConnect. We've carefully reviewed your <strong>${roleLabel}</strong> profile application.
            </p>
            <div style="background:#fff1f2;border-left:4px solid #f87171;padding:20px;border-radius:12px;margin-bottom:24px;">
              <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">
                Unfortunately, we cannot approve your selling privileges at this time. This could be due to incomplete documentation or verification failure.
              </p>
            </div>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              <strong>Don't worry:</strong> You can still use your account to buy products. If you believe this is a mistake, you can update your profile details and try again.
            </p>
          </div>
          <div style="background:#f8fafc;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} KrishiConnect Support Team</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Rejection email sent to ${userEmail}.`);
  } catch (error) {
    console.error("[Email] sendProfileRejectionEmail failed:", error.message);
  }
};
// ─── Delivery Profile Creation Request ─────────────────────────────────────
export const sendDeliveryProfileCreationEmail = async (userEmail) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "🚚 Delivery Partner Request Received — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:40px 20px;text-align:center;">
            <div style="background:rgba(255,255,255,0.2);width:60px;height:60px;border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:30px;">🚚</div>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">KrishiConnect Logistics</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;">
            <h2 style="color:#1e3a8a;margin-top:0;font-size:22px;font-weight:700;">Partner Registration Received!</h2>
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
              Hello,<br><br>
              We've received your application to join KrishiConnect as a <strong>Delivery Partner</strong>. 
            </p>
            <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;border-radius:12px;margin-bottom:24px;">
              <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.6;">
                <strong>Current Status:</strong> <span style="background:#dbeafe;padding:2px 8px;border-radius:99px;font-weight:600;text-transform:uppercase;font-size:11px;">Verification in Progress</span><br><br>
                Our team is reviewing your documents (License/Aadhar) and vehicle details. You'll be notified via email once approved.
              </p>
            </div>
          </div>
          <div style="background:#f1f5f9;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:500;">© ${new Date().getFullYear()} KrishiConnect Logistics</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] sendDeliveryProfileCreationEmail failed:", error.message);
  }
};

// ─── Delivery Profile Approved ─────────────────────────────────────────────
export const sendDeliveryProfileApprovalEmail = async (userEmail) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "🏁 Welcome to the Team! — KrishiConnect Logistics",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:50px 20px;text-align:center;">
            <div style="font-size:64px;margin-bottom:10px;">🏁</div>
            <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:900;">You're Approved!</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;text-align:center;">
            <h2 style="color:#1e3a8a;margin-top:0;font-size:22px;font-weight:700;">Ready to Start Delivering?</h2>
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:30px;">
              Congratulations! Your delivery partner profile has been approved. You can now go online and start receiving job requests from sellers.
            </p>
            <div style="margin:32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/delivery-dashboard" style="background:#1e40af;color:#ffffff;padding:18px 40px;text-decoration:none;border-radius:14px;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 10px 15px -3px rgba(30,64,175,0.3);">
                Open Delivery Dashboard →
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] sendDeliveryProfileApprovalEmail failed:", error.message);
  }
};

// ─── Delivery Job Notification ──────────────────────────────────────────────
export const sendDeliveryJobNotificationEmail = async (userEmail, jobData) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: userEmail,
      subject: "🔔 New Delivery Job Request! — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:40px 20px;text-align:center;">
             <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">New Hire Request</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;">
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
              A seller has requested your delivery services for a new order.
            </p>
            <div style="background:#f1f5f9;padding:24px;border-radius:16px;margin-bottom:24px;">
              <table style="width:100%;font-size:14px;color:#334155;">
                <tr><td style="padding:4px 0;font-weight:600;">Order ID:</td><td style="text-align:right;">#${jobData.orderId.slice(-8).toUpperCase()}</td></tr>
                <tr><td style="padding:4px 0;font-weight:600;">Distance:</td><td style="text-align:right;">${jobData.distance} KM</td></tr>
                <tr><td style="padding:4px 0;font-weight:600;">Est. Earning:</td><td style="text-align:right;color:#059669;font-weight:700;">₹${jobData.totalPrice}</td></tr>
              </table>
            </div>
            <div style="text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/delivery-dashboard" style="background:#1e40af;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;display:inline-block;">Accept Job →</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] sendDeliveryJobNotificationEmail failed:", error.message);
  }
};
// ─── Delivery OTP to Buyer ──────────────────────────────────────────────────
export const sendDeliveryOTPEmail = async (buyerEmail, orderId, otp) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: buyerEmail,
      subject: "📦 Delivery Verification OTP — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 20px;text-align:center;">
             <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Delivery OTP</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;text-align:center;">
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
              Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> is out for delivery. 
              Please provide the following OTP to the delivery partner only after you have received your package.
            </p>
            <div style="background:#f1f5f9;padding:30px;border-radius:20px;margin-bottom:24px;display:inline-block;min-width:200px;">
              <span style="font-size:48px;font-weight:900;letter-spacing:10px;color:#059669;font-family:monospace;">${otp}</span>
            </div>
            <p style="color:#ef4444;font-size:13px;font-weight:600;">
              ⚠️ Do not share this OTP over the phone or with anyone except the delivery person at the time of delivery.
            </p>
          </div>
          <div style="background:#f1f5f9;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:500;">© ${new Date().getFullYear()} KrishiConnect Logistics</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Delivery OTP sent to ${buyerEmail}.`);
  } catch (error) {
    console.error("[Email] sendDeliveryOTPEmail failed:", error.message);
  }
};
// ─── Delivery Completion to Seller ──────────────────────────────────────────
export const sendDeliveryCompletionEmailToSeller = async (sellerEmail, orderId, partnerName) => {
  try {
    const mailer = getTransporter();
    await mailer.sendMail({
      from: sender(),
      to: sellerEmail,
      subject: "🎊 Order Delivered Successfully! — KrishiConnect",
      html: `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#f8fafc;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 20px;text-align:center;">
             <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Delivery Complete!</h1>
          </div>
          <div style="background:#ffffff;padding:40px;border-radius:24px 24px 0 0;margin-top:-20px;">
            <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
              Great news! Your Order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been successfully delivered by <strong>${partnerName}</strong>.
            </p>
            <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px;border-radius:12px;margin-bottom:24px;">
              <p style="margin:0;color:#166534;font-size:14px;line-height:1.6;">
                The buyer has verified the delivery using their secure OTP. Your sale is now complete, and the revenue has been added to your dashboard stats.
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/farmer-dashboard/sales" style="background:#059669;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;display:inline-block;">View Sales Data →</a>
            </div>
          </div>
          <div style="background:#f1f5f9;padding:24px;text-align:center;">
             <p style="color:#94a3b8;font-size:12px;margin:0;font-weight:500;">© ${new Date().getFullYear()} KrishiConnect</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Delivery completion email sent to seller ${sellerEmail}.`);
  } catch (error) {
    console.error("[Email] sendDeliveryCompletionEmailToSeller failed:", error.message);
  }
};
