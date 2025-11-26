
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { products } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function MarketplacePage() {
  return (
    <div>
      <PageHeader
        title="Women's Marketplace"
        description="Discover and support businesses led by women in our community."
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Link key={product.id} href={`/dashboard/marketplace/${product.id}`} className="group">
            <Card className="overflow-hidden h-full flex flex-col">
              <CardHeader className="p-0">
                <div className="relative aspect-4/3 w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="product lifestyle"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow">
                <p className="mb-1 text-lg font-headline flex-grow">{product.name}</p>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={`https://picsum.photos/seed/${product.seller.id}/100/100`}
                      alt={product.seller.name}
                      data-ai-hint="woman seller"
                    />
                    <AvatarFallback>
                      {product.seller.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{product.seller.name}</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <Badge variant="secondary" className="text-base">
                    ₹{product.price.toLocaleString()}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-foreground">
                      {product.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviewCount})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
