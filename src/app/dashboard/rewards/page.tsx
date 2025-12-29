'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Coins, Gift, Loader, ShoppingBag, CheckCircle } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { getRedeemableItems, redeemItem, getUserRedemptions, getUserWallet } from '@/lib/fantasy/services';
import type { RedeemableItem, UserRedemption } from '@/lib/fantasy/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

export default function RewardsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [items, setItems] = useState<RedeemableItem[]>([]);
  const [redemptions, setRedemptions] = useState<UserRedemption[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RedeemableItem | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [activeItems, userRedemptions, wallet] = await Promise.all([
          getRedeemableItems(firestore, { activeOnly: true }),
          getUserRedemptions(firestore, user.uid),
          getUserWallet(firestore, user.uid),
        ]);
        setItems(activeItems);
        setRedemptions(userRedemptions);
        setBalance(wallet?.balance || 0);
      } catch (error) {
        console.error('Error loading rewards:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load rewards.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [firestore, user?.uid, toast]);

  const handleRedeem = async (item: RedeemableItem) => {
    if (!firestore || !user?.uid) return;

    setRedeeming(item.id);
    try {
      const result = await redeemItem(firestore, user.uid, item.id);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `You've successfully redeemed ${item.name}!`,
        });
        
        // Reload data
        const [activeItems, userRedemptions, wallet] = await Promise.all([
          getRedeemableItems(firestore, { activeOnly: true }),
          getUserRedemptions(firestore, user.uid),
          getUserWallet(firestore, user.uid),
        ]);
        setItems(activeItems);
        setRedemptions(userRedemptions);
        setBalance(wallet?.balance || 0);
        setShowRedeemDialog(false);
        setSelectedItem(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Redemption Failed',
          description: result.error || 'Failed to redeem item.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to redeem item.',
      });
    } finally {
      setRedeeming(null);
    }
  };

  const canRedeem = (item: RedeemableItem) => {
    if (!item.isActive) return false;
    if (item.stock !== undefined && item.stock <= 0) return false;
    return balance >= item.coinCost;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards Catalog"
        description="Redeem your coins for amazing vouchers, gifts, and prizes!"
      />

      {/* Balance Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Coin Balance</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {balance.toLocaleString()} <span className="text-lg">coins</span>
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="my-redemptions">My Redemptions</TabsTrigger>
        </TabsList>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="mt-6">
          {loading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No rewards available at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.imageUrl && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.value && (
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-bold text-lg">{item.value}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-bold text-xl">{item.coinCost} coins</p>
                      </div>
                      {item.stock !== undefined && (
                        <div>
                          <p className="text-sm text-muted-foreground">Stock</p>
                          <p className="font-semibold">{item.stock} left</p>
                        </div>
                      )}
                    </div>

                    {item.terms && (
                      <p className="text-xs text-muted-foreground">{item.terms}</p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRedeemDialog(true);
                      }}
                      disabled={!canRedeem(item) || redeeming === item.id}
                    >
                      {redeeming === item.id ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : !canRedeem(item) ? (
                        balance < item.coinCost ? 'Insufficient Coins' : 'Not Available'
                      ) : (
                        <>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Redeem Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Redemptions Tab */}
        <TabsContent value="my-redemptions" className="mt-6">
          {loading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : redemptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't redeemed any items yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {redemptions.map((redemption) => (
                <Card key={redemption.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{redemption.itemName}</h3>
                          <Badge variant={
                            redemption.status === 'fulfilled' ? 'default' :
                            redemption.status === 'pending' ? 'secondary' :
                            redemption.status === 'approved' ? 'default' :
                            redemption.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {redemption.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Redeemed for {redemption.coinCost} coins
                        </p>
                        {redemption.voucherCode && (
                          <div className="p-3 bg-muted rounded-lg mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Voucher Code</p>
                            <p className="font-mono font-bold text-lg">{redemption.voucherCode}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Redeemed: {redemption.redeemedAt && (
                            redemption.redeemedAt instanceof Date
                              ? redemption.redeemedAt.toLocaleString()
                              : (redemption.redeemedAt as any)?.toDate?.()?.toLocaleString() || 'N/A'
                          )}
                        </p>
                        {redemption.expiryDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires: {(redemption.expiryDate as any)?.toDate?.()?.toLocaleString() || 'N/A'}
                          </p>
                        )}
                      </div>
                      {redemption.status === 'fulfilled' && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this item?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{selectedItem.name}</p>
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span>Cost:</span>
                  <span className="font-bold">{selectedItem.coinCost} coins</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Your Balance:</span>
                  <span className="font-bold">{balance} coins</span>
                </div>
                <div className="flex items-center justify-between mt-2 border-t pt-2">
                  <span>Remaining:</span>
                  <span className="font-bold">{balance - selectedItem.coinCost} coins</span>
                </div>
              </div>
              {selectedItem.terms && (
                <p className="text-xs text-muted-foreground">{selectedItem.terms}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRedeemDialog(false);
              setSelectedItem(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedItem && handleRedeem(selectedItem)}
              disabled={!selectedItem || redeeming === selectedItem.id}
            >
              {redeeming === selectedItem?.id ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Redemption'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

