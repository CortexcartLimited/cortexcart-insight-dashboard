// src/app/page.tsx

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth'; // Correctly import authOptions

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (session) {
        // If the user is logged in, redirect them to the dashboard.
        redirect('/dashboard');
    } else {
        // If the user is not logged in, redirect them to the login page.
        redirect('/login');
    }

    // This component will never render anything because a redirect always occurs.
    return null;
}