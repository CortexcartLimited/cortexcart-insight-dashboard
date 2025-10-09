// File: src/app/api/images/upload/route.js

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
        if (fileExtension !== '.jpeg' && fileExtension !== '.jpg') {
            return NextResponse.json({ message: 'Only JPEG or JPG files are allowed.' }, { status: 400 });
        }


        // Convert the file data to a Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a new filename to avoid conflicts
        const uniqueFilename = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(process.cwd(), 'public/uploads', uniqueFilename);
        
        // Write the file to the filesystem
        await writeFile(uploadPath, buffer);
        
        const publicUrl = `/uploads/${uniqueFilename}`;

        // Save the image URL to the database
        const [result] = await db.query(
            'INSERT INTO user_images (user_email, image_url, filename) VALUES (?, ?, ?)',
            [session.user.email, publicUrl, file.name]
        );
        
        // Fetch the newly created record to return to the client
        const [newImage] = await db.query('SELECT * FROM user_images WHERE id = ?', [result.insertId]);

        return NextResponse.json(newImage[0], { status: 201 });

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({ message: 'File upload failed.' }, { status: 500 });
    }
}