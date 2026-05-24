import nodemailer from 'nodemailer';

console.log('Initializing email transporter...');
console.log('EMAIL_USER defined:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS defined:', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {
  console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
  try {
    const info = await transporter.sendMail({
      from: `"HRMS Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`Email successfully sent to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};
