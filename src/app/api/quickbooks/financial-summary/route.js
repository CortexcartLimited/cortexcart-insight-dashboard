// src/app/api/quickbooks/financial-summary/route.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';
import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';

// Helper function (getQuickBooksClient) remains the same as before...
const getQuickBooksClient = async (userEmail) => {
    const [connections] = await db.query(
        'SELECT access_token_encrypted, refresh_token_encrypted, realm_id FROM social_connect WHERE user_email = ? AND platform = ?',
        [userEmail, 'quickbooks']
    );

    if (!connections.length) {
        throw new Error('QuickBooks connection not found.');
    }

    const connection = connections[0];
    const realmId = connection.realm_id;
    let accessToken = decrypt(connection.access_token_encrypted);
    let refreshToken = decrypt(connection.refresh_token_encrypted);

    const oauthClient = new OAuthClient({
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        environment: 'sandbox', // or 'production'
        redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
    });
    
    const authResponse = await oauthClient.refreshUsingToken(refreshToken);
    if (authResponse.getJson().access_token !== accessToken) {
        accessToken = authResponse.getJson().access_token;
        refreshToken = authResponse.getJson().refresh_token;

        await db.query(
            'UPDATE social_connect SET access_token_encrypted = ?, refresh_token_encrypted = ? WHERE user_email = ? AND platform = ?',
            [encrypt(accessToken), encrypt(refreshToken), userEmail, 'quickbooks']
        );
    }
    
    return new QuickBooks(
        process.env.QUICKBOOKS_CLIENT_ID,
        process.env.QUICKBOOKS_CLIENT_SECRET,
        accessToken,
        false, 
        realmId,
        true, // use sandbox
        false,
        null, 
        '2.0',
        refreshToken
    );
};

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const qbo = await getQuickBooksClient(session.user.email);

        const PnLReport = () => new Promise((resolve, reject) => {
            qbo.reportProfitAndLoss({ date_macro: 'This Fiscal Year-to-date' }, (err, report) => {
                if (err) return reject(err);
                resolve(report);
            });
        });

        const pnl = await PnLReport();

        // --- NEW: Add this line for powerful debugging ---
        // It shows you the exact structure of the data you're getting.
        console.log("QuickBooks P&L Report Structure:", JSON.stringify(pnl, null, 2));
        
        // --- THIS IS THE CORRECTED, SAFER PARSING LOGIC ---
        const findRowValue = (rows, target) => {
            const row = rows.find(r => 
                // Check that the row has the structure we expect before reading it
                r.Header && r.Header.ColData && r.Header.ColData[0].value === target
            );
            // If the row is found, return its value, otherwise return '0'
            return row ? row.Summary.ColData[0].value : '0';
        };

        const rows = pnl.Rows.Row || []; // Ensure rows is always an array
        
        const totalRevenue = findRowValue(rows, 'Total Income');
        const totalExpenses = findRowValue(rows, 'Total Expenses');
        const netProfit = findRowValue(rows, 'Net Operating Income');

        return NextResponse.json({
            totalRevenue: parseFloat(totalRevenue).toFixed(2),
            totalExpenses: parseFloat(totalExpenses).toFixed(2),
            netProfit: parseFloat(netProfit).toFixed(2),
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching QuickBooks financial summary:', error);
        return NextResponse.json({ message: `Failed to fetch data: ${error.message}` }, { status: 500 });
    }
}