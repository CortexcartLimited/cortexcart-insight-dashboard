// src/app/api/auth/admin-login/route.js (Corrected)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// Helper function to get the ADMIN JWT secret
const getAdminSecret = () => {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) {
        throw new Error("JWT_ADMIN_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
};

export async function POST(req) {
    let connection;
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new NextResponse("Email and password are required", { status: 400 });
        }

        connection = await db.getConnection();

        // 1. Find the admin user by email
        const [rows] = await connection.query('SELECT * FROM admins WHERE email = ?', [email]);
        const admin = rows[0];

        if (!admin) {
            return new NextResponse("Invalid credentials", { status: 401 });
        }

        // 2. Securely compare the provided password with the hashed password from the database
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return new NextResponse("Invalid credentials", { status: 401 });
        }

        // 3. If the password is valid, create a session token
        const secret = getAdminSecret();
        const token = await new SignJWT({
            userId: admin.id,
            email: admin.email,
            role: admin.role,
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
        
        const response = NextResponse.json({ message: "Login successful" }, { status: 200 });

        response.cookies.set('admin-session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60,
        });

        return response;

    } catch (error) {
        console.error('[ADMIN_LOGIN_ERROR]', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}