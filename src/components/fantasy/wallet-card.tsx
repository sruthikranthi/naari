'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, TrendingUp, History, Gift } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { getUserWallet, getCoinTransactions } from '@/lib/fantasy/services';
import { awardDailyLoginCoins, canClaimDailyLogin } from '@/lib/fantasy/coin-rewards';
import { useToast } from '@/hooks/use-toast';
import type { CoinTransaction } from '@/lib/fantasy/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function WalletCard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const loadWallet = async () => {
      try {
        setLoading(true);
        const wallet = await getUserWallet(firestore, user.uid);
        setBalance(wallet?.balance || 0);

        const canClaimDaily = await canClaimDailyLogin(firestore, user.uid);
        setCanClaim(canClaimDaily);

        // Load recent transactions
        const recentTransactions = await getCoinTransactions(firestore, user.uid, 10);
        setTransactions(recentTransactions);
      } catch (error) {
        console.error('Error loading wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, [firestore, user?.uid]);

  const handleClaimDaily = async () => {
    if (!firestore || !user?.uid || claiming) return;

    setClaiming(true);
    try {
      const result = await awardDailyLoginCoins(firestore, user.uid);
      
      if (result.awarded) {
        toast({
          title: 'Daily Bonus Claimed!',
          description: result.message,
        });
        
        // Reload wallet
        const wallet = await getUserWallet(firestore, user.uid);
        setBalance(wallet?.balance || 0);
        setCanClaim(false);
        
        // Reload transactions
        const recentTransactions = await getCoinTransactions(firestore, user.uid, 10);
        setTransactions(recentTransactions);
      } else {
        toast({
          variant: 'destructive',
          title: 'Already Claimed',
          description: 'You have already claimed your daily bonus today.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to claim daily bonus.',
      });
    } finally {
      setClaiming(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes('win') || type.includes('bonus') || type === 'referral') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (type === 'fantasy-entry') {
      return <Coins className="h-4 w-4 text-yellow-500" />;
    }
    return <Gift className="h-4 w-4 text-blue-500" />;
  };

  const formatTransactionDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp instanceof Date 
        ? timestamp 
        : timestamp.toDate 
        ? timestamp.toDate() 
        : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          My Wallet
        </CardTitle>
        <CardDescription>Your coin balance and transaction history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {balance?.toLocaleString() || 0}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Daily Login Bonus */}
        {canClaim && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Login Bonus Available!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Claim your daily coins
                </p>
              </div>
              <Button
                onClick={handleClaimDaily}
                disabled={claiming}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                {claiming ? 'Claiming...' : 'Claim 10 Coins'}
              </Button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Transactions
            </h3>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No transactions yet. Start earning coins!
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getTransactionIcon(transaction.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTransactionDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={transaction.amount > 0 ? 'default' : 'destructive'}
                      className={
                        transaction.amount > 0
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earning Tips */}
        <div className="p-3 bg-muted rounded-lg space-y-3">
          <p className="text-xs font-medium mb-2">💡 Ways to Earn Coins:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Daily login: 10 coins</li>
            <li>• Read blogs: 5 coins each</li>
            <li>• Watch reels: 3 coins each</li>
            <li>• Complete quizzes: 15 coins each</li>
            <li>• Refer friends: 50 coins</li>
            <li>• Win fantasy games: Bonus coins!</li>
          </ul>
          <Link href="/dashboard/rewards">
            <Button variant="outline" className="w-full mt-3" size="sm">
              <Gift className="mr-2 h-4 w-4" />
              Redeem Coins for Rewards
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

