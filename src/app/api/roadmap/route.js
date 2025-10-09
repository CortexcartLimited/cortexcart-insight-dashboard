import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Handles updating a specific roadmap feature
export async function PUT(req, { params }) {
    const session = await verifyAdminSession();
    if (!session) {
        return new NextResponse(JSON.stringify({ message: "Not Authenticated" }), { status: 401 });
    }

    try {
        const { id } = params; // Correctly access the ID from params
        const body = await req.json();
        const { name, description, status } = body;

        if (!name || !description || !status) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Use a direct SQL UPDATE query
        const [result] = await db.query(
            'UPDATE roadmap_features SET name = ?, description = ?, status = ? WHERE id = ?',
            [name, description, status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Roadmap feature not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Feature updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('[ROADMAP_PUT_ERROR]', error);
        return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}

// Handles deleting a specific roadmap feature
export async function DELETE(req, { params }) {
    const session = await verifyAdminSession();
    if (!session) {
        return new NextResponse(JSON.stringify({ message: "Not Authenticated" }), { status: 401 });
    }

    try {
        const { id } = params; // Correctly access the ID

        // Use a direct SQL DELETE query
        const [result] = await db.query('DELETE FROM roadmap_features WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Roadmap feature not found' }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 }); // Success, no content

    } catch (error) {
        console.error('[ROADMAP_DELETE_ERROR]', error);
        return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }
}