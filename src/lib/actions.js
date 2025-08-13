'use server';

import { cookies } from 'next/headers';

export async function clearCookies() {
    cookies().delete('x_oauth_code_verifier');
    cookies().delete('x_oauth_state');
}