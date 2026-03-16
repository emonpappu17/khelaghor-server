import nodemailer from "nodemailer";
import { env } from "../config/env";

export const sendEmail = async (to: string, html: string, subject: string) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"Support Team" <${env.SMTP_USER}>`,
            to,
            subject,
            text: html.replace(/<[^>]+>/g, ""),
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        // console.log(info);
        return info.messageId;
    } catch (error: any) {
        console.error("Error sending email:", error?.message || error);
        throw new Error("Failed to send email. Please try again later.");
    }
};



