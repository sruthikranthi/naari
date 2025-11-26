
'use client';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductClient } from './product-client';
import type { Product } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

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
        // This could be a more user-friendly error component
        return <p>Error loading product. It may have been removed or you may not have permission to view it.</p>;
    }

    if (!product) {
        notFound();
    }

    return <ProductClient product={product} />;
}


export default function ProductDetailPage() {
    return <ProductDetailPageContent />;
}
