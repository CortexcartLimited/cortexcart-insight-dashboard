'use client';

import React from 'react';
import Link from 'next/link'; // Assuming Link is used for navigation
import { Card, CardHeader, CardContent, Typography, Button, Box, Alert, Skeleton } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Layout from '@/app/components/Layout';

// Mock hook to simulate checking for QuickBooks connection.
// In a real application, this would come from a user context or API call.
const useQuickBooksConnection = () => {
  // This is for demonstration. Replace with your actual logic.
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      // In a real app, you'd check something like:
      // const user = await fetchUser();
      // setIsConnected(user.integrations.quickbooks.connected);
      setIsLoading(false);
    }, 1000);
  }, []);

  return { isConnected, isLoading, setIsConnected };
};

const QuickBooksFinancialsDashboard = () => {
  // Placeholder for the actual financials dashboard.
  // This would be composed of various components showing financial data.
  return (

    <Card className="border-0">
      <CardHeader title="QuickBooks Financials Dashboard" />
      <CardContent>
        <Typography variant="body1">
          Your key financial metrics from QuickBooks are displayed here.
        </Typography>
        {/* TODO: Implement actual financial charts and data display */}
      </CardContent>
    </Card>
  );
};

const ConnectQuickBooksPrompt = () => {
  return (
    <Card sx={{ textAlign: 'center', p: 4 }}>
      <CardContent>
         <MonetizationOnIcon color="primary" sx={{ fontSize: '2.75rem' }} />
        <Typography variant="h5" component="h2" gutterBottom>
          Connect to QuickBooks
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          To view your financial dashboard, please connect your QuickBooks account in the settings.
        </Typography>
        <Link href="/settings#platforms" passHref>
          <Button variant="contained" color="primary">
            Go to QuickBooks Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

const FinancialsPageSkeleton = () => (
  <Layout>
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="40%" sx={{ fontSize: '2.5rem' }} />
      </Box>

      {/* Alert Skeleton */}
      <Skeleton variant="rounded" width={400} height={56} sx={{ mb: 4 }} />

      {/* Main Card Skeleton */}
      <Card sx={{ p: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Skeleton variant="text" width="50%" sx={{ fontSize: '1.5rem' }} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rounded" width={220} height={36} />
        </CardContent>
      </Card>
    </Box>
  </Layout>
);

export default function FinancialsPage() {
  const { isConnected, isLoading, setIsConnected } = useQuickBooksConnection();

  if (isLoading) {
    return <FinancialsPageSkeleton />;
  }
const dummyQuickBooksData = {
  totalRevenue: '$250,000',
  totalExpenses: '$180,000',
  netProfit: '$70,000',
  accountsReceivable: '$30,000',
  accountsPayable: '$15,000',
  profitAndLoss: [
    { month: 'Jan', revenue: 20000, expenses: 15000 },
    { month: 'Feb', revenue: 22000, expenses: 16000 },
    { month: 'Mar', revenue: 25000, expenses: 18000 },
    { month: 'Apr', revenue: 23000, expenses: 17000 },
    { month: 'May', revenue: 28000, expenses: 20000 },
    { month: 'Jun', revenue: 30000, expenses: 22000 },
  ],
  balanceSheet: {
    assets: {
      currentAssets: 50000,
      fixedAssets: 100000,
      totalAssets: 150000,
    },
    liabilities: {
      currentLiabilities: 20000,
      longTermLiabilities: 30000,
      totalLiabilities: 50000,
    },
    },
  };
  

  return (
    <Layout>
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          QuickBooks 
<Box sx={{ flexGrow: 1, p: 3 }}></Box>
        </Typography>
        {/* Add any global actions or filters here if needed */}
      </Box>

      {/* The following Alert is for demonstration purposes to allow toggling the state. Remove in production. */}
      <Alert severity="info" action={
        <Button color="inherit" size="small" onClick={() => setIsConnected(prev => !prev)}>
          Toggle Connection
        </Button>
      } sx={{ mb: 4, maxWidth: 'fit-content' }}>
        For demonstration: You are currently {isConnected ? 'connected' : 'not connected'} to QuickBooks.
      </Alert>

      {isConnected ? (
        <>
          <QuickBooksFinancialsDashboard />
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Key Financials
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dummyQuickBooksData.totalRevenue}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dummyQuickBooksData.totalExpenses}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Net Profit
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dummyQuickBooksData.netProfit}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Accounts Receivable
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dummyQuickBooksData.accountsReceivable}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Accounts Payable
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dummyQuickBooksData.accountsPayable}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Profit and Loss Trend
            </Typography>
            <Card>
              <CardContent>
                {/* Placeholder */}
              </CardContent>
            </Card>
          </Box>
        </>
      ) : (
        <ConnectQuickBooksPrompt />
      )}
    </Box>
    </Layout>
  );
}