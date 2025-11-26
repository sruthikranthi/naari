
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { products as initialProducts, users } from '@/lib/mock-data';
import type { Product } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().min(1, { message: 'Price must be greater than 0.' }),
  category: z.string().min(2, { message: 'Please enter a category.' }),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = (data: ProductFormValues) => {
    const newProduct: Product = {
      id: `prod${Date.now()}`,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      seller: users[0], // Mocking the seller as the current user
      images: [`https://picsum.photos/seed/newProd${products.length + 1}/600/400`],
      rating: 0,
      reviewCount: 0,
      reviews: [],
    };
    setProducts([newProduct, ...products]);
    toast({
      title: 'Product Listed!',
      description: `Your product "${data.name}" is now live on the marketplace.`,
    });
    reset();
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Women's Marketplace"
          description="Discover and support businesses led by women in our community."
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              List a Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>List a New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" placeholder="e.g., Handmade Scented Candles" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail..."
                    rows={4}
                    {...register('description')}
                  />
                  {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" placeholder="499" {...register('price')} />
                    {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" placeholder="e.g., Home Decor" {...register('category')} />
                    {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
                  </div>
                </div>
                 <div>
                    <Label htmlFor="images">Product Image</Label>
                    <Input id="images" type="file" accept="image/*" />
                     <p className="mt-1 text-xs text-muted-foreground">Image upload is for demonstration only.</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit">List Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
