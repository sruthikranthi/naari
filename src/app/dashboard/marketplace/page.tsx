
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Plus, SlidersHorizontal, ChevronDown, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Product, User } from '@/lib/mock-data';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().min(1, { message: 'Price must be greater than 0.' }),
  category: z.string().min(2, { message: 'Please enter a category.' }),
});

type ProductFormValues = z.infer<typeof productSchema>;


export default function MarketplacePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const productsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'marketplace_listings') : null),
    [firestore, user]
  );
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);
  
  const allCategories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.category))];
  }, [products]);
  
  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 10000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([maxPrice]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (maxPrice > 0) {
        setPriceRange([maxPrice]);
    }
  }, [maxPrice]);


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication required' });
        return;
    }
    const sellerInfo = {
        id: user.uid,
        name: user.displayName || 'Anonymous Seller',
        avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
    };

    const newProduct = {
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      sellerId: user.uid,
      seller: sellerInfo, // Denormalized for display
      images: [`https://picsum.photos/seed/newProd${products?.length || 0 + 1}/600/400`],
      rating: 0,
      reviewCount: 0,
      reviews: [],
      createdAt: serverTimestamp(),
    };

    try {
        await addDoc(collection(firestore, 'marketplace_listings'), newProduct);
        toast({
          title: 'Product Listed!',
          description: `Your product "${data.name}" is now live on the marketplace.`,
        });
        reset();
        setIsDialogOpen(false);
    } catch(e) {
        console.error("Error creating product:", e);
        toast({ variant: 'destructive', title: 'Error listing product' });
    }
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products
      .filter(p => selectedCategories.length === 0 || selectedCategories.includes(p.category))
      .filter(p => p.price <= priceRange[0])
      .filter(p => p.rating >= selectedRating);

    switch (sortBy) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
        default:
            // Assuming newer products are at the beginning of the original array (default from Firestore)
            break;
    }
    return filtered;
  }, [products, selectedCategories, priceRange, selectedRating, sortBy]);
  
  const isLoading = isUserLoading || areProductsLoading;

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
        {/* Filters Sidebar */}
        <aside className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Filters
                        <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedCategories([]);
                            setPriceRange([maxPrice]);
                            setSelectedRating(0);
                        }}>Clear</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2">Category</h4>
                        <div className="space-y-2">
                            {allCategories.map(category => (
                                <div key={category} className="flex items-center gap-2">
                                    <Checkbox 
                                        id={`cat-${category}`} 
                                        checked={selectedCategories.includes(category)}
                                        onCheckedChange={() => handleCategoryChange(category)}
                                    />
                                    <Label htmlFor={`cat-${category}`}>{category}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold mb-4">Price Range</h4>
                        <Slider 
                            value={priceRange} 
                            onValueChange={setPriceRange} 
                            max={maxPrice} 
                            step={100}
                        />
                         <p className="text-sm text-muted-foreground mt-2 text-right">Up to ₹{priceRange[0].toLocaleString()}</p>
                    </div>
                    <Separator />
                     <div>
                        <h4 className="font-semibold mb-2">Rating</h4>
                        <RadioGroup value={String(selectedRating)} onValueChange={(val) => setSelectedRating(Number(val))}>
                            {[4, 3, 2, 1, 0].map(rating => (
                                <div key={rating} className="flex items-center space-x-2">
                                    <RadioGroupItem value={String(rating)} id={`rating-${rating}`} />
                                    <Label htmlFor={`rating-${rating}`} className="flex items-center">
                                       {rating > 0 ? (
                                           <>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}/>
                                            ))}
                                            <span className="ml-2 text-muted-foreground">& up</span>
                                           </>
                                       ) : 'Any Rating'}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                </CardContent>
            </Card>
        </aside>

        {/* Products Grid */}
        <main className="md:col-span-3">
             <div className="flex justify-end mb-4">
                 <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden h-full flex flex-col">
                            <Skeleton className="aspect-4/3 w-full" />
                            <CardContent className="p-4 flex flex-col flex-grow">
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-4" />
                                <div className="flex items-center justify-between mt-auto">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-5 w-12" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAndSortedProducts.map((product) => (
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
                                src={product.seller.avatar || `https://picsum.photos/seed/${product.sellerId}/100/100`}
                                alt={product.seller.name}
                                data-ai-hint="woman seller"
                                />
                                <AvatarFallback>
                                {product.seller.name
                                    ?.split(' ')
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
                                {product.rating.toFixed(1)}
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
            )}
            {!isLoading && filteredAndSortedProducts.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">No products found</h3>
                    <p>Try adjusting your filters.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
