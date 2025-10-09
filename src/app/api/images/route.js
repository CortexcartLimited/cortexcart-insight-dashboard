import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET function to fetch all images for the logged-in user
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [images] = await db.query(
            'SELECT id, image_url, filename, uploaded_at FROM user_images WHERE user_email = ? ORDER BY uploaded_at DESC',
            [session.user.email]
        );
        return NextResponse.json(images);

    } catch (error) {
        console.error('Error fetching images:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST function to add a new image from a URL
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { imageUrl } = await request.json();
        if (!imageUrl) {
            return NextResponse.json({ message: 'Image URL is required' }, { status: 400 });
        }

        // Validate the URL format (simple validation)
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
             return NextResponse.json({ message: 'Invalid URL format' }, { status: 400 });
        }

        // Insert the new image URL into the database
        const [result] = await db.query(
            'INSERT INTO user_images (user_email, image_url, filename) VALUES (?, ?, ?)',
            [session.user.email, imageUrl, 'URL'] // Using 'URL' as a placeholder filename
        );

        // Fetch the newly created image to return to the client
        const [newImage] = await db.query(
            'SELECT id, image_url, filename, uploaded_at FROM user_images WHERE id = ?',
            [result.insertId]
        );
        
        return NextResponse.json(newImage[0], { status: 201 });

    } catch (error) {
        console.error('Error adding image:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}