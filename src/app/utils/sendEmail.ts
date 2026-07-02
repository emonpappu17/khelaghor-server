import nodemailer from "nodemailer";
import { env } from "../config/env";
import dns from "node:dns";

export const sendEmail = async (to: string, html: string, subject: string) => {
    try {
        // const transporter = nodemailer.createTransport({
        //     service: "gmail",
        //     auth: {
        //         user: env.SMTP_USER,
        //         pass: env.SMTP_PASS,
        //     },
        // });

        const transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: Number(env.SMTP_PORT),
            // secure: true, // 465
            secure: false,
            requireTLS: true,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
            getSocket: (options: any, callback: any) => {
                dns.lookup(options.host, { family: 4 }, (err, address) => {
                    if (err) return callback(err);

                    const net = require("net");
                    const socket = net.connect({
                        host: address,
                        port: options.port,
                    });

                    callback(null, socket);
                });
            },
        });

        const mailOptions = {
            from: `"Support Team" <${env.SMTP_USER}>`,
            to,
            subject,
            text: html.replace(/<[^>]+>/g, ""),
            html,
        };
        console.log('check is log 2==>', to, html, subject);
        await transporter.verify();
        console.log("SMTP connection successful");
        const info = await transporter.sendMail(mailOptions);
        // console.log(info);
        return info.messageId;
    } catch (error: any) {
        console.error("===== SMTP ERROR =====");
        console.error(error);
        console.error("Code:", error?.code);
        console.error("Command:", error?.command);
        console.error("Response:", error?.response);
        console.error("======================");
        throw new Error("Failed to send email. Please try again later.");
    }
};



