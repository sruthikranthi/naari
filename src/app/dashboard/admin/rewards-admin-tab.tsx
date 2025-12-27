'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Coins, 
  Award, 
  TrendingUp, 
  Loader,
  Plus,
  Edit,
  Trash2,
  Users,
  Gift,
} from 'lucide-react';
import {
  getUserWallet,
  updateUserWalletBalance,
  getCoinTransactions,
  getUserBadges,
  awardBadge,
} from '@/lib/fantasy/services';
import type {
  UserWallet,
  UserBadge,
  CoinTransaction,
} from '@/lib/fantasy/types';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BADGE_DEFINITIONS, COIN_REWARDS } from '@/lib/fantasy/constants';

interface RewardsAdminTabProps {
  firestore: Firestore | null;
  user: FirebaseUser | null;
  toast: ReturnType<typeof useToast>['toast'];
}

export function RewardsAdminTab({ firestore, user, toast }: RewardsAdminTabProps) {
  const [activeTab, setActiveTab] = useState<'wallets' | 'badges' | 'transactions' | 'rewards'>('wallets');
  const [wallets, setWallets] = useState<Array<{ userId: string; wallet: UserWallet }>>([]);
  const [badges, setBadges] = useState<Array<{ userId: string; badges: UserBadge[] }>>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showAwardCoins, setShowAwardCoins] = useState(false);
  const [showAwardBadge, setShowAwardBadge] = useState(false);

  const loadData = useCallback(async () => {
    if (!firestore) return;
    
    setLoading(true);
    try {
      // Load all wallets
      const walletsQuery = query(collection(firestore, 'user_wallets'));
      const walletsSnapshot = await getDocs(walletsQuery);
      const walletsData = await Promise.all(
        walletsSnapshot.docs.map(async (doc) => {
          const wallet = { id: doc.id, ...doc.data() } as UserWallet;
          return { userId: doc.id, wallet };
        })
      );
      setWallets(walletsData);

      // Load all badges
      const badgesQuery = query(collection(firestore, 'user_badges'));
      const badgesSnapshot = await getDocs(badgesQuery);
      const badgesByUser = new Map<string, UserBadge[]>();
      badgesSnapshot.docs.forEach((doc) => {
        const badge = { id: doc.id, ...doc.data() } as UserBadge;
        if (!badgesByUser.has(badge.userId)) {
          badgesByUser.set(badge.userId, []);
        }
        badgesByUser.get(badge.userId)!.push(badge);
      });
      setBadges(Array.from(badgesByUser.entries()).map(([userId, badges]) => ({ userId, badges })));

      // Load recent transactions
      const transactionsQuery = query(
        collection(firestore, 'coin_transactions'),
        where('createdAt', '!=', null)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as CoinTransaction))
        .sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
          const bTime = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        })
        .slice(0, 100); // Last 100 transactions
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading rewards data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load rewards data.',
      });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  useEffect(() => {
    if (firestore) {
      loadData();
    }
  }, [firestore, loadData]);

  if (!firestore || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please sign in to manage rewards.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards & Coins Management
          </CardTitle>
          <CardDescription>
            Manage user wallets, badges, and coin transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="wallets">Wallets</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="rewards">Award Rewards</TabsTrigger>
            </TabsList>

            {/* Wallets Tab */}
            <TabsContent value="wallets" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Wallets</h3>
                <Button onClick={loadData} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No wallets found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wallets.map(({ userId, wallet }) => (
                    <Card key={userId}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">User: {userId.slice(0, 8)}...</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Balance</p>
                                <p className="font-semibold text-lg">{wallet.balance || 0} coins</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Earned</p>
                                <p className="font-semibold">{wallet.totalEarned || 0} coins</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Spent</p>
                                <p className="font-semibold">{wallet.totalSpent || 0} coins</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(userId);
                              setShowAwardCoins(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Award Coins
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Badges</h3>
                <Button onClick={loadData} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : badges.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No badges found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {badges.map(({ userId, badges: userBadges }) => (
                    <Card key={userId}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">User: {userId.slice(0, 8)}...</h3>
                              <Badge>{userBadges.length} badges</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {userBadges.map((badge) => (
                                <Badge key={badge.id} variant="secondary">
                                  {badge.badgeType}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(userId);
                              setShowAwardBadge(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Award Badge
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
                <Button onClick={loadData} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions found.</p>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              User: {tx.userId.slice(0, 8)}... • Type: {tx.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount} coins
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.createdAt && (tx.createdAt instanceof Date 
                                ? tx.createdAt.toLocaleString()
                                : (tx.createdAt as any)?.toDate?.()?.toLocaleString() || 'N/A')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Award Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Award Coins</CardTitle>
                    <CardDescription>Manually award coins to a user</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowAwardCoins(true)} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Award Coins to User
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Award Badge</CardTitle>
                    <CardDescription>Manually award a badge to a user</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowAwardBadge(true)} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Award Badge to User
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Coin Reward Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Daily Login</p>
                      <p className="font-semibold">{COIN_REWARDS.DAILY_LOGIN} coins</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Blog Read</p>
                      <p className="font-semibold">{COIN_REWARDS.BLOG_READ} coins</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reel Watch</p>
                      <p className="font-semibold">{COIN_REWARDS.REEL_WATCH} coins</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quiz Complete</p>
                      <p className="font-semibold">{COIN_REWARDS.QUIZ_COMPLETE} coins</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Referral</p>
                      <p className="font-semibold">{COIN_REWARDS.REFERRAL} coins</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fantasy Win (Exact)</p>
                      <p className="font-semibold">{COIN_REWARDS.FANTASY_WIN_EXACT} coins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => (
                      <div key={key}>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-muted-foreground text-xs">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Award Coins Dialog */}
      <Dialog open={showAwardCoins} onOpenChange={setShowAwardCoins}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Coins</DialogTitle>
            <DialogDescription>
              Manually award coins to a user.
            </DialogDescription>
          </DialogHeader>
          <AwardCoinsForm
            firestore={firestore}
            userId={selectedUserId}
            onSuccess={() => {
              setShowAwardCoins(false);
              setSelectedUserId('');
              loadData();
            }}
            toast={toast}
          />
        </DialogContent>
      </Dialog>

      {/* Award Badge Dialog */}
      <Dialog open={showAwardBadge} onOpenChange={setShowAwardBadge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Badge</DialogTitle>
            <DialogDescription>
              Manually award a badge to a user.
            </DialogDescription>
          </DialogHeader>
          <AwardBadgeForm
            firestore={firestore}
            userId={selectedUserId}
            onSuccess={() => {
              setShowAwardBadge(false);
              setSelectedUserId('');
              loadData();
            }}
            toast={toast}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Award Coins Form
function AwardCoinsForm({
  firestore,
  userId: initialUserId,
  onSuccess,
  toast,
}: {
  firestore: Firestore;
  userId: string;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: initialUserId,
    amount: 0,
    description: '',
    type: 'admin-award' as CoinTransaction['type'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserWalletBalance(
        firestore,
        formData.userId,
        formData.amount,
        formData.type,
        formData.description || 'Admin awarded coins'
      );

      toast({
        title: 'Success',
        description: `Awarded ${formData.amount} coins to user.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error awarding coins:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to award coins.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          required
          placeholder="Enter user ID"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (coins)</Label>
        <Input
          id="amount"
          type="number"
          min="1"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Reason for awarding coins"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Transaction Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin-award">Admin Award</SelectItem>
            <SelectItem value="daily-login">Daily Login</SelectItem>
            <SelectItem value="blog-read">Blog Read</SelectItem>
            <SelectItem value="reel-watch">Reel Watch</SelectItem>
            <SelectItem value="quiz-complete">Quiz Complete</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="fantasy-win">Fantasy Win</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Awarding...
          </>
        ) : (
          'Award Coins'
        )}
      </Button>
    </form>
  );
}

// Award Badge Form
function AwardBadgeForm({
  firestore,
  userId: initialUserId,
  onSuccess,
  toast,
}: {
  firestore: Firestore;
  userId: string;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: initialUserId,
    badgeType: 'gold-queen' as UserBadge['badgeType'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await awardBadge(firestore, formData.userId, formData.badgeType);

      toast({
        title: 'Success',
        description: `Badge "${formData.badgeType}" awarded to user.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error awarding badge:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to award badge.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          required
          placeholder="Enter user ID"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="badgeType">Badge Type</Label>
        <Select
          value={formData.badgeType}
          onValueChange={(value) => setFormData({ ...formData, badgeType: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => (
              <SelectItem key={key} value={key}>
                {badge.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Awarding...
          </>
        ) : (
          'Award Badge'
        )}
      </Button>
    </form>
  );
}

