'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, Typography, Button, Box, Alert, Skeleton } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Layout from '@/app/components/Layout';

// Mock hook to simulate checking for Shopify connection.
// In a real application, this would come from a user context or API call.
const useShopifyConnection = () => {
  // This is for demonstration. Replace with your actual logic.
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate fetching user data
 setTimeout(() => {
      // In a real app, you'd check something like:
      // const user = await fetchUser();
      // setIsConnected(user.integrations.shopify.connected);
      setIsLoading(false);
    }, 1000);
  }, []);

  return { isConnected, isLoading, setIsConnected };
};

// Dummy data for demonstration
const dummyFinancialData = {
  totalRevenue: '$125,450',
  totalOrders: '2,150',
  averageOrderValue: '$58.35',
  conversionRate: '2.5%',
  revenueByMonth: [
    { month: 'Jan', revenue: 10000 },
    { month: 'Feb', revenue: 12000 },
    { month: 'Mar', revenue: 15000 },
    { month: 'Apr', revenue: 13000 },
    { month: 'May', revenue: 18000 },
    { month: 'Jun', revenue: 20000 },
  ],
  topProducts: [
    { name: 'Product A', sales: 50000 },
    { name: 'Product B', sales: 30000 },
    { name: 'Product C', sales: 20000 },
  ],
};

const ShopifyFinancialsDashboard = () => {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Overview
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" color="text.secondary">Total Revenue</Typography>
            <Typography variant="h4">{dummyFinancialData.totalRevenue}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" color="text.secondary">Total Orders</Typography>
            <Typography variant="h4">{dummyFinancialData.totalOrders}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" color="text.secondary">Average Order Value</Typography>
            <Typography variant="h4">{dummyFinancialData.averageOrderValue}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" color="text.secondary">Conversion Rate</Typography>
            <Typography variant="h4">{dummyFinancialData.conversionRate}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Revenue Trends
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Revenue by Month</Typography>
          {/* Simple bar chart representation */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 200, borderBottom: '1px solid #eee', borderLeft: '1px solid #eee', pr: 1, pb: 1 }}>
            {dummyFinancialData.revenueByMonth.map((data, index) => (
              <Box key={index} sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                px: 0.5,
              }}>
                <Box sx={{
                  width: '60%',
                  height: `${(data.revenue / Math.max(...dummyFinancialData.revenueByMonth.map(d => d.revenue))) * 90}%`, // Scale to 90% of container height
                  bgcolor: 'primary.main',
                  borderRadius: '4px 4px 0 0',
                  mb: 0.5,
                }} />
                <Typography variant="caption">{data.month}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Top Products
      </Typography>
      <Card>
        <CardContent>
          {dummyFinancialData.topProducts.map((product, index) => (
            <Typography key={index} variant="body1">{product.name}: ${product.sales.toLocaleString()}</Typography>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

const ConnectShopifyPrompt = () => {
  return (
    <Card sx={{ textAlign: 'center', p: 4 }}>
      <CardContent>
         <MonetizationOnIcon color="primary" sx={{ fontSize: '2.75rem' }} />
        <Typography variant="h5" component="h2" gutterBottom>
          Connect to Shopify
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          To view your financial dashboard, please connect your Shopify account in the settings.
        </Typography>
        <Link href="/settings#shopify" passHref>
          <Button variant="contained" color="primary">
            Go to Shopify Settings
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
  const { isConnected, isLoading, setIsConnected } = useShopifyConnection();

  if (isLoading) {
    return <FinancialsPageSkeleton />;
  }

  return (
    <Layout>
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Shopify Financials Dashboard
        </Typography>
        {/* Add any global actions or filters here if needed */}
      </Box>

      {/* The following Alert is for demonstration purposes to allow toggling the state. Remove in production. */}
      <Alert severity="info" action={
        <Button color="inherit" size="small" onClick={() => setIsConnected((prev) => !prev)}>
          Toggle Connection
        </Button>
      } sx={{ mb: 4, maxWidth: 'fit-content' }}>
        For demonstration: You are currently {isConnected ? 'connected' : 'not connected'} to Shopify.
      </Alert>

      {isConnected ? <ShopifyFinancialsDashboard /> : <ConnectShopifyPrompt />}
    </Box>
    </Layout>
  );
}