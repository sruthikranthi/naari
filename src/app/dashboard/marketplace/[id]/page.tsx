
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductClient } from './product-client';
import type { Product } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function ProductDetailPageContent() {
    const params = useParams();
    const { id } = params;
    const firestore = useFirestore();

    const productRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'marketplace_listings', id as string) : null),
        [firestore, id]
    );

    const { data: product, isLoading, error } = useDoc<Product>(productRef);

    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-6 w-1/2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Skeleton className="aspect-square w-full" />
                        <div className="grid grid-cols-5 gap-2">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
                        </div>
                    </div>
                     <div className="space-y-6">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
             </div>
        );
    }
    
    if (error) {
        console.error("Error fetching product:", error);
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <p className="text-lg font-semibold">Error Loading Product</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading the product. It may have been removed or you may not have permission to view it.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/marketplace'}>
                View Marketplace
              </Button>
            </div>
          </div>
        );
    }

    if (!product) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <p className="text-lg font-semibold">Product Not Found</p>
            <p className="text-sm text-muted-foreground">
              The product you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/marketplace'}>
                View Marketplace
              </Button>
            </div>
          </div>
        );
    }

    return <ProductClient product={product} />;
}


export default function ProductDetailPage() {
    return <ProductDetailPageContent />;
}
