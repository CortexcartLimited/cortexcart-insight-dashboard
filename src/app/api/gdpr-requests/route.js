import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req) {
    const { name, email, request } = await req.json();

    if (!name || !email || !request) {
        return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // This uses the same email transport configuration as your contact form
    // Ensure your .env.local file has the required EMAIL_HOST, EMAIL_PORT, etc.
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM, // e.g., 'no-reply@cortexcart.com'
        to: 'gdpr@cortexcart.com', // The specific GDPR email address
        replyTo: email,
        subject: `New GDPR Data Request from ${name}`,
        html: `
            <h1>GDPR Data Subject Access Request</h1>
            <p>You have received a new data request through the website.</p>
            <hr>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <hr>
            <h2>Request Details:</h2>
            <p style="white-space: pre-wrap;">${request}</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return NextResponse.json({ message: 'Your request has been sent successfully.' });
    } catch (error) {
        console.error('GDPR Request email error:', error);
        return NextResponse.json({ message: 'Failed to send your request. Please try again later.' }, { status: 500 });
    }
}