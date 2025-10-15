// src/app/api/images/upload/route.js
import { writeFile } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const data = await request.formData();
        const file = data.get('file');

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        const fileExtension = path.extname(file.name).toLowerCase();
        // --- FIX: Allow PNG files ---
        if (!['.jpeg', '.jpg', '.png'].includes(fileExtension)) {
            return NextResponse.json({ message: 'Only JPEG, JPG, or PNG files are allowed.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // --- FIX: Sanitize the filename to make it URL-safe ---
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
        const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
        
        const uploadPath = path.join(process.cwd(), 'public/uploads', uniqueFilename);
        
        await writeFile(uploadPath, buffer);
        
        const publicUrl = `/uploads/${uniqueFilename}`;

        const [result] = await db.query(
            'INSERT INTO user_images (user_email, image_url, filename) VALUES (?, ?, ?)',
            [session.user.email, publicUrl, file.name]
        );
        
        const [newImage] = await db.query('SELECT * FROM user_images WHERE id = ?', [result.insertId]);

        return NextResponse.json(newImage[0], { status: 201 });

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({ message: 'File upload failed.' }, { status: 500 });
    }
}