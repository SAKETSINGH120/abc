const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465, // Use 465 for SSL
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;

// console.log("Email User:", process.env.EMAIL_USER);
// console.log("Email User length:", process.env.EMAIL_USER?.length);

// async function sendEmail({ to, subject, text, html }) {
//   // Configure Gmail SMTP transporter
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER?.trim(), // Trim any whitespace
//       pass: process.env.EMAIL_PASS?.trim(), // Trim any whitespace
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     text,
//     html,
//   };

//   // Send the email
//   return transporter.sendMail(mailOptions);
// }

// module.exports = sendEmail;
