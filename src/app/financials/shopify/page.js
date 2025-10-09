'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/app/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import Image from 'next/image';
import { Terminal, ShoppingCart, Box, Store, DollarSign, LineChart } from 'lucide-react';
import ShopifyProductList from '@/app/components/ShopifyProductList'; // Import the new component

// --- Main Dashboard Component for displaying Shopify stats ---
const ShopifyDashboard = ({ stats, onReconnect }) => {
    // This component renders the main view when the store is connected.
    if (!stats || !stats.shop) {
        return (
             <div className="text-center">
                <p className="mb-4">Could not load Shopify data. The connection might have expired.</p>
                <Button onClick={onReconnect}>Reconnect Now</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-x-3">
                         <Store className="h-6 w-6 text-gray-500" />
                        <div>
                            <CardTitle>Welcome, {stats.shop.name}!</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">Here is a summary of your store.</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                    <p><strong>Store URL:</strong> <a href={`https://${stats.shop.myshopify_domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{stats.shop.myshopify_domain}</a></p>
                    <p><strong>Contact Email:</strong> {stats.shop.email}</p>
                    <p><strong>Plan:</strong> <span className="font-medium">{stats.shop.plan_display_name}</span></p>
                    <p><strong>Currency:</strong> {stats.shop.currency}</p>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* --- TOTAL SALES CARD (NEW) --- */}
                <Card className="bg-blue-50 border-blue-200 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shop.currency_symbol}{parseFloat(stats.totalSales).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All-time net sales</p>
                    </CardContent>
                </Card>

                {/* --- TOTAL VISITS CARD (NEW) --- */}
                <Card className="bg-green-50 border-green-200 shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                        <LineChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All-time store sessions</p>
                    </CardContent>
                </Card>

                {/* --- TOTAL PRODUCTS CARD --- */}
                {stats.productsCount !== null && (
                    <Card className="bg-purple-50 border-purple-200 shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <Box className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.productsCount}</div>
                            <p className="text-xs text-muted-foreground">Number of active products</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* --- RECENT PRODUCTS LIST (NEW) --- */}
            {stats.recentProducts && stats.recentProducts.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recently Added Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y divide-gray-200">
                            {stats.recentProducts.map(product => (
                                <li key={product.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {product.image?.src ? (
                                            <Image src={product.image.src} alt={product.title} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                                <Box className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                        <p className="text-sm font-medium text-gray-800">{product.title}</p>
                                    </div>
                                    <span className="text-sm text-gray-500">{stats.shop.currency_symbol}{product.variants[0].price}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
            <ShopifyProductList />
        </div>
    );
};

// --- Connection Component for when Shopify is not yet linked ---
const ShopifyConnect = ({ onConnect }) => {
    const [shopName, setShopName] = useState('');
    return (
        <Card className="max-w-md mx-auto shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    Connect to Shopify
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-gray-600">
                    To view your financial data, please connect your Shopify store. Enter your store&apos;s name below.
                </p>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                        type="text"
                        placeholder="your-store-name"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                    />
                     <span className="text-sm text-gray-500">.myshopify.com</span>
                </div>
                <Button onClick={() => onConnect(shopName)} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                    Connect Shopify
                </Button>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---
export default function ShopifyPage() {
    const { data: session } = useSession();
    const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, isLoading: true });
    const [shopifyData, setShopifyData] = useState(null);
    const [error, setError] = useState(null);

    const handleConnect = (shopName) => {
        if (!shopName) {
            alert('Please enter your shop name.');
            return;
        }
        window.location.href = `/api/connect/shopify?shop=${shopName}`;
    };
    
    useEffect(() => {
        const checkConnectionAndFetchData = async () => {
            if (!session) return;

            // First, check the connection status
            try {
                const statusRes = await fetch('/api/social/connections/status', { cache: 'no-store' });
                const statusData = await statusRes.json();
                
                if (statusData.shopify?.isConnected) {
                    setConnectionStatus({ isConnected: true, isLoading: false });
                    
                    // If connected, fetch the store data
                    try {
                        const dataRes = await fetch('/api/shopify/store-info');
                        if (!dataRes.ok) throw new Error('Failed to fetch Shopify data');
                        const data = await dataRes.json();
                        setShopifyData(data);
                    } catch {
                         setError('Could not load Shopify data. The connection might be invalid.');
                    }

                } else {
                    setConnectionStatus({ isConnected: false, isLoading: false });
                }
            } catch {
                setError('Failed to check Shopify connection status.');
                setConnectionStatus({ isConnected: false, isLoading: false });
            }
        };

        checkConnectionAndFetchData();
    }, [session]);

    const renderContent = () => {
        if (connectionStatus.isLoading) {
            return <div className="text-center">Loading...</div>;
        }
    
        if (error) {
             return (
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>
                        {error} Please try refreshing the page.
                    </AlertDescription>
                </Alert>
            );
        }

        if (connectionStatus.isConnected) {
            return <ShopifyDashboard stats={shopifyData} onReconnect={handleConnect}/>;
        } else {
            return <ShopifyConnect onConnect={handleConnect} />;
        }
    };

    return (
        <Layout>
            <div className="mb-6">
                 <h1 className="text-3xl font-bold">Shopify Financials</h1>
                 <p className="text-gray-500 mt-1">View your store&apos;s performance and key metrics.</p>
            </div>
            
            <div className="container mx-auto p-4">
                 {renderContent()}
            </div>
        </Layout>
    );
}