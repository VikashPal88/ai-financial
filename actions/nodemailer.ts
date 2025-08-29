import nodemailer from "nodemailer";

export async function sendEmail(
  subject: string,
  templateName: string,
  data: Record<string, string>
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO,
    subject,
    text: `Template: ${templateName}, Data: ${JSON.stringify(data)}`,
  });
}
