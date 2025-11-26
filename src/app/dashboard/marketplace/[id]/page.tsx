
import { notFound } from 'next/navigation';
import { products } from '@/lib/mock-data';
import { ProductClient } from './product-client';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return <ProductClient product={product} />;
}
