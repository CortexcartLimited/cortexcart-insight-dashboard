import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configure Email Transporter (Use your SMTP details here)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export async function POST(req) {
    try {
        const { email, password, name, honeypot } = await req.json();

        // 1. HONEYPOT CHECK (Bot Protection)
        // If the hidden field 'honeypot' has ANY value, it's a bot.
        if (honeypot) {
            console.log(`Bot detected for email: ${email}`);
            // Return fake success to confuse the bot
            return NextResponse.json({ message: 'Registration successful. Please check your email.' }, { status: 200 });
        }

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 2. Check if user already exists
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
        }

        // 3. Prepare User Data
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        // Generate a random ID (since you aren't using UUID library, we can use crypto)
        const userId = crypto.randomUUID(); 

        // 4. Save to Database (Verified is NULL initially)
        await db.query(
            `INSERT INTO users (id, email, password_hash, name, verification_token, emailVerified, created_at) 
             VALUES (?, ?, ?, ?, ?, NULL, NOW())`,
            [userId, email, hashedPassword, name, verificationToken]
        );

        // 5. Send Verification Email
        const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Verify your Cortexcart Account',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Welcome to Cortexcart!</h2>
                    <p>Please verify your email address to access your dashboard.</p>
                    <a href="${verifyUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>Or paste this link: ${verifyUrl}</p>
                </div>
            `,
        });

        return NextResponse.json({ message: 'Registration successful. Please check your email.' }, { status: 201 });

    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}