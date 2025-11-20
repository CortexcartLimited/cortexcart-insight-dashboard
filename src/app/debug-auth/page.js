// src/app/debug-auth/page.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserSubscription } from '@/lib/userSubscription';
import { getPlanDetails } from '@/lib/plans';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Force real-time data

export default async function DebugAuthPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Not logged in</div>;
  }

  const email = session.user.email;
  
  // 1. Direct DB Query (What is actually in the table?)
  let dbRaw = null;
  try {
    const [rows] = await db.query('SELECT * FROM sites WHERE user_email = ?', [email]);
    dbRaw = rows[0];
  } catch (e) {
    dbRaw = { error: e.message };
  }

  // 2. Subscription Helper (What the middleware uses)
  const subHelper = await getUserSubscription(email);

  // 3. Plan Resolver (What logic determines)
  const planFromHelper = getPlanDetails(subHelper?.stripePriceId);
  
  return (
    <div className="p-10 font-mono text-sm space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-red-600">Auth & Subscription Debugger</h1>
      
      <div className="p-4 bg-white border rounded shadow">
        <h2 className="font-bold mb-2">1. Session Data</h2>
        <pre>{JSON.stringify(session.user, null, 2)}</pre>
      </div>

      <div className="p-4 bg-white border rounded shadow">
        <h2 className="font-bold mb-2">2. Raw Database Row (Table: sites)</h2>
        <p className="text-gray-500 mb-2">This is exactly what is stored in your DB right now.</p>
        <pre>{JSON.stringify(dbRaw, null, 2)}</pre>
      </div>

      <div className="p-4 bg-white border rounded shadow">
        <h2 className="font-bold mb-2">3. Middleware Logic Check</h2>
        <p className="text-gray-500 mb-2">This is what the middleware sees when you load a page.</p>
        <div className="space-y-2">
            <p><strong>Email Used:</strong> {email}</p>
            <p><strong>Helper Result:</strong> {JSON.stringify(subHelper)}</p>
            <p><strong>Resolved Plan ID:</strong> {planFromHelper?.id}</p>
            <p><strong>Resolved Plan Name:</strong> {planFromHelper?.name}</p>
            <p><strong>Support Tickets Allowed?</strong> {String(planFromHelper?.limits?.supportTickets)}</p>
        </div>
      </div>
    </div>
  );
}