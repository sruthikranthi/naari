

'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Plus,
  Minus,
  MessageSquare,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { type Product as ProductType } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-context';

type ProductClientProps = {
  product: ProductType;
};

export function ProductClient({ product }: ProductClientProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: 'Added to Cart!',
      description: `${quantity} x "${product.name}" has been added to your cart.`,
    });
  };
  
  const ratingDistribution = [
    { star: 5, percentage: 80 },
    { star: 4, percentage: 15 },
    { star: 3, percentage: 3 },
    { star: 2, percentage: 2 },
    { star: 1, percentage: 0 },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/marketplace">Marketplace</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {product.images.map((img, index) => (
              <button
                key={index}
                className={cn(
                  'relative aspect-square w-full overflow-hidden rounded-md border-2',
                  selectedImage === img
                    ? 'border-primary'
                    : 'border-transparent'
                )}
                onClick={() => setSelectedImage(img)}
              >
                <Image
                  src={img}
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-primary">{product.category.toUpperCase()}</p>
            <h1 className="font-headline text-3xl font-bold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < product.rating
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </p>
            </div>
          </div>
          
          <p className="text-lg">{product.description}</p>
          
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold">₹{product.price.toLocaleString()}</p>
            <Badge>10% OFF</Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11">
                <Heart className='h-5 w-5'/>
            </Button>
          </div>
          
          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                 <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={product.seller.avatar || `https://picsum.photos/seed/${product.sellerId}/100/100`}
                    alt={product.seller.name}
                  />
                  <AvatarFallback>{product.seller.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-muted-foreground">Sold by</p>
                    <p className="text-lg font-semibold">{product.seller.name}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Seller
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-center">
                    <p className="text-5xl font-bold">{product.rating.toFixed(1)}</p>
                    <div className="flex justify-center items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                            'h-5 w-5',
                            i < Math.round(product.rating)
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-muted-foreground'
                            )}
                        />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Based on {product.reviewCount} reviews</p>
                </div>
                <div className="w-full flex-1">
                    {ratingDistribution.map(item => (
                        <div key={item.star} className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.star} star</span>
                            <Progress value={item.percentage} className="h-2 w-full" />
                            <span className="text-sm text-muted-foreground w-10 text-right">{item.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />
            
            <div className="space-y-6">
                {product.reviews && product.reviews.length > 0 ? product.reviews.map(review => (
                <div key={review.id} className="flex gap-4">
                    <Avatar>
                        <AvatarFallback>{review.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">{review.author}</p>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={cn(
                                'h-4 w-4',
                                i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/50'
                                )}
                            />
                            ))}
                        </div>
                        <h4 className="font-medium mt-2">{review.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    </div>
                </div>
                )) : (
                  <p className="text-center text-sm text-muted-foreground py-8">No reviews for this product yet. Be the first to leave one!</p>
                )}
            </div>
            {product.reviews?.length > 0 && <Button variant="outline" className="w-full">Load More Reviews</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
