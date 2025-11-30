'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc } from 'firebase/firestore';
import { Loader2, ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { useCart } from '@/context/cart-context';
import { Separator } from './ui/separator';
import { useCashfreeCheckout } from '@/hooks/use-cashfree';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import type { User } from '@/lib/mock-data';

export function CartSheet() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<User>(userDocRef);
  const {
    cartItems,
    cartCount,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { isReady: isCashfreeReady, error: cashfreeError, openCheckout } =
    useCashfreeCheckout();

  useEffect(() => {
    if (cashfreeError) {
      toast({
        variant: 'destructive',
        title: 'Cashfree is unavailable',
        description: cashfreeError,
      });
    }
  }, [cashfreeError, toast]);

  const canCheckout = cartCount > 0 && cartTotal > 0;
  const isCheckoutDisabled = !canCheckout || isCheckingOut || !!cashfreeError || !isCashfreeReady;

  const handleCheckout = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please sign in',
        description: 'You need to be logged in to complete the purchase.',
      });
      return;
    }

    if (!canCheckout) {
      return;
    }

    if (!isCashfreeReady) {
      toast({
        variant: 'destructive',
        title: 'Payment gateway is still loading',
        description: 'Please wait a moment and try again.',
      });
      return;
    }

    const phoneNumber = user.phoneNumber ?? userProfile?.mobileNumber;

    if (!phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Mobile number required',
        description: 'Please add your mobile number in profile settings to continue.',
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      const returnUrl =
        process.env.NEXT_PUBLIC_CASHFREE_RETURN_URL ??
        (typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard/marketplace?paymentStatus=success`
          : undefined);

      const response = await fetch('/api/payments/cashfree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: cartTotal,
          currency: 'INR',
          cartItems: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          customer: {
            id: user.uid,
            name: user.displayName ?? userProfile?.name ?? 'Naari member',
            email: user.email ?? undefined,
            phone: phoneNumber,
          },
          metadata: {
            cartTotal,
            itemCount: cartCount,
          },
          orderNote: `Marketplace purchase of ${cartItems.length} item(s)`,
          returnUrl,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(
          errorPayload?.error ?? 'Failed to initiate Cashfree checkout.'
        );
      }

      const { paymentSessionId } = await response.json();

      await openCheckout(paymentSessionId);
    } catch (error) {
      console.error('Cashfree checkout failed', error);
      toast({
        variant: 'destructive',
        title: 'Unable to start payment',
        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {cartCount}
            </span>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart ({cartCount})</SheetTitle>
        </SheetHeader>
        {cartCount > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price.toLocaleString()}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                           onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <SheetFooter className="mt-auto">
              <div className="w-full space-y-4">
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckoutDisabled}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Cashfree checkout...
                    </>
                  ) : (
                    'Pay securely with Cashfree'
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Cashfree powers secure payments for Naarimani.
                </p>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-muted-foreground">
              Add items to your cart to see them here.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
