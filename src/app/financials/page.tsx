'use client';

import React from 'react';
import Link from 'next/link'; // Assuming Link is used for navigation
import { Card, CardHeader, CardContent, Typography, Button, Box, Alert, CircularProgress } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Layout from '../components/Layout';

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
   
    <Card>
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
        <Link href="/settings/platforms/quickbooks" passHref>
          <Button variant="contained" color="primary">
            Go to QuickBooks Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default function FinancialsPage() {
  const { isConnected, isLoading, setIsConnected } = useQuickBooksConnection();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout>
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Financials Dashboard
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

      {isConnected ? <QuickBooksFinancialsDashboard /> : <ConnectQuickBooksPrompt />}
    </Box>
    </Layout>
  );
}