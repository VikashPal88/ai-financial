import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  react?: string; // rendered React email as HTML string
  text?: string;  // optional plain text fallback
}

export async function sendTemplatedEmail({
  to,
  subject,
  react,
  text,
}: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html: react || `<p>${text || "No content provided"}</p>`,
    text,
  });
}
