import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Load your environment variables here or pass them in from .env
const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_MAIL_HOST,
  port: Number(process.env.NEXT_PUBLIC_MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.NEXT_PUBLIC_MAIL_USER,
    pass: process.env.NEXT_PUBLIC_MAIL_PASS,
  },
});

export async function 

(
  subject: string,
  templateName: string,
  data: Record<string, string>,
  emailRecipients: string[]
) {
  try {
    // Load the template file 
    // const templatePath = path.join(process.cwd(), 'emails', `${templateName}.tsx`);

    const templatePath = path.join(process.cwd(), 'emails', 'template.tsx');


    let template = fs.readFileSync(templatePath, 'utf-8');

    // Replace placeholders with data
    Object.keys(data).forEach((key) => {
      const placeholder = `{${key}}`;
      template = template.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    // sendTemplatedEmail("Join Notaas","invitation_email_for_shared_note", {user_who_shared: validSession.username}, [email] )

    // Define mail options
    const mailOptions = {
      from: "victororigin88@gmail.com",
      // to: emailRecipients.join(', '),
      to: "vs700034@getMaxListeners.com",
      // subject: subject, // Customize as needed
      subject: "Welcome to AI finance website", // Customize as needed
      // html: template,
      html: template,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error in sendTemplatedEmail:", error);
    throw error;
  }
}
