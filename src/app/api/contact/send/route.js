import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const { name, email, message } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json({ message: 'Name, email, and message are required.' }, { status: 400 });
        }

        // --- Nodemailer Transporter Setup ---
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT || 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        // --- Email Content ---
        const mailOptions = {
            from: `"CortexCart Contact Form" <${process.env.MAIL_USER}>`,
            to: 'contact@cortexcart.com', // Your general contact email address
            replyTo: email,
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2>New Contact Inquiry</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <hr>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `,
        };

        // --- Send the Email ---
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Message sent successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Error sending contact email:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
