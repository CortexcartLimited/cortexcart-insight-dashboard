import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { subject, message } = await request.json();

        if (!subject || !message) {
            return NextResponse.json({ message: 'Subject and message are required.' }, { status: 400 });
        }

        const userEmail = session.user.email;
        const feedbackType = subject === 'bug' ? 'Bug Report' : 'Feature Request';

        // --- Nodemailer Transporter Setup ---
        // This uses the environment variables you set up in .env.local
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT || 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        // --- Email Content ---
        const mailOptions = {
            from: `"CortexCart Feedback" <${process.env.MAIL_USER}>`,
            to: 'beta@cortexcart.com', // The address that receives the feedback
            replyTo: userEmail,
            subject: `[Feedback] ${feedbackType} from ${userEmail}`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2>New ${feedbackType}</h2>
                    <p><strong>From:</strong> ${userEmail}</p>
                    <hr>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `,
        };

        // --- Send the Email ---
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Feedback sent successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Error sending feedback:', error);
        // Provide a more specific error message if the transport fails
        if (error.code === 'EENVELOPE') {
             return NextResponse.json({ message: 'Failed to send feedback. Please check server email configuration.' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
