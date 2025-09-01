'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Box } from 'lucide-react';
import Image from 'next/image';

export default function ShopifyProductList() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextPageInfo, setNextPageInfo] = useState(null);

    const fetchProducts = async (pageInfo = null) => {
        setIsLoading(true);
        setError(null);
        try {
            // Use the new dedicated API route
            const response = await fetch(`/api/shopify/products${pageInfo ? `?page_info=${pageInfo}` : ''}`);
            if (!response.ok) {
                throw new Error('Failed to fetch products.');
            }
            const data = await response.json();
            setProducts(data.products);
            setNextPageInfo(data.nextPageInfo);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    if (isLoading && products.length === 0) {
        return <p>Loading products...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Your Products</CardTitle>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <div className="space-y-4">
                        <ul className="divide-y divide-gray-200">
                            {products.map(product => (
                                <li key={product.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {product.image?.src ? (
                                            <Image src={product.image.src} alt={product.title} className="h-12 w-12 rounded-md object-cover" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                                                <Box className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{product.title}</p>
                                            <p className="text-sm text-gray-500">{product.product_type}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold">{product.variants[0].price}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={() => fetchProducts(nextPageInfo)}
                                disabled={!nextPageInfo || isLoading}
                            >
                                {isLoading ? 'Loading...' : 'Next Page'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No products found.</p>
                )}
            </CardContent>
        </Card>
    );
}