
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Crown, Ticket, Users, Clock, PartyPopper, Award, HelpCircle, Share2, Copy, Check, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, arrayUnion, query, where, serverTimestamp, getDocs } from 'firebase/firestore';
import type { TambolaGame, User } from '@/lib/mock-data';
import { searchUsers } from '@/lib/search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { TambolaSetupDialog } from '@/components/tambola-setup-dialog';
import { JoinRequestsManager } from '@/components/join-requests-manager';

// A more robust function to generate a valid Tambola ticket
const generateTicket = (): (number | null)[][] => {
  const ticket: (number | null)[][] = Array(3).fill(0).map(() => Array(9).fill(null));

  // 1. Distribute 15 numbers across 3 rows (5 numbers per row)
  const numbersPerRow = [5, 5, 5];
  const colCounts = Array(9).fill(0);
  
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < numbersPerRow[row]; i++) {
      let col: number;
      do {
        col = Math.floor(Math.random() * 9);
      } while (ticket[row][col] !== null || colCounts[col] >= 3 || (row === 1 && ticket[0][col] === null && colCounts[col] === 2) || (row === 2 && (ticket[0][col] === null || ticket[1][col] === null) && colCounts[col] >= 2) );
      ticket[row][col] = 0; // Placeholder
      colCounts[col]++;
    }
  }

  // Ensure each column has at least one number
  for (let col = 0; col < 9; col++) {
    if (colCounts[col] === 0) {
      let rowToStealFrom: number, colToStealFrom: number;
      do {
        rowToStealFrom = Math.floor(Math.random() * 3);
        colToStealFrom = Math.floor(Math.random() * 9);
      } while (colToStealFrom === col || colCounts[colToStealFrom] <= 1);
      
      ticket[rowToStealFrom][col] = 0;
      ticket[rowToStealFrom][colToStealFrom] = null;
      colCounts[col]++;
      colCounts[colToStealFrom]--;
    }
  }

  // 2. Populate columns with unique, sorted numbers
  for (let col = 0; col < 9; col++) {
    const min = col * 10 + (col === 0 ? 1 : 0);
    const max = col * 10 + 9;
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    range.push(col * 10 + 10); // for cols 0-7, this is 10,20...80. for col 8, it's 90.
    if(col === 0) range.shift();
    if (col === 8) range[0] = 80;


    let colNums: number[] = [];
    for (let row = 0; row < 3; row++) {
      if (ticket[row][col] !== null) {
        let num;
        do {
          num = range[Math.floor(Math.random() * range.length)];
        } while (colNums.includes(num));
        colNums.push(num);
      }
    }
    colNums.sort((a, b) => a - b);
    
    let numIndex = 0;
    for (let row = 0; row < 3; row++) {
      if (ticket[row][col] !== null) {
        ticket[row][col] = colNums[numIndex++];
      }
    }
  }
  return ticket;
};

const prizes = [
    { id: 'corners', name: 'Four Corners', description: 'All 4 corner numbers' },
    { id: 'top_line', name: 'Top Line', description: 'All numbers in the top row' },
    { id: 'middle_line', name: 'Middle Line', description: 'All numbers in the middle row' },
    { id: 'bottom_line', name: 'Bottom Line', description: 'All numbers in the bottom row' },
    { id: 'full_house', name: 'Full House', description: 'All 15 numbers on the ticket' },
];

export default function TambolaPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [ticket, setTicket] = useState<(number | null)[][]>([]);
  const [dabbedNumbers, setDabbedNumbers] = useState<number[]>([]);
  const [claimedPrizes, setClaimedPrizes] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'paused' | 'ended'>('idle');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [pendingGameData, setPendingGameData] = useState<{ orderId: string; paymentId: string } | null>(null);

  // Fetch current game if gameId is in localStorage
  const gameIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('current_tambola_game_id') : null;
  const gameRef = useMemoFirebase(
    () => (firestore && gameIdFromStorage ? doc(firestore, 'tambola_games', gameIdFromStorage) : null),
    [firestore, gameIdFromStorage]
  );
  const { data: currentGame } = useDoc<TambolaGame>(gameRef);

  // Fetch players
  const playersQuery = useMemoFirebase(
    () => (firestore && currentGame?.playerIds && currentGame.playerIds.length > 0) 
      ? query(collection(firestore, 'users'), where('id', 'in', currentGame.playerIds.slice(0, 10))) // Firestore 'in' limit is 10
      : null,
    [firestore, currentGame?.playerIds]
  );
  const { data: players } = useCollection<User>(playersQuery);

  const isGameAdmin = currentGame?.adminId === user?.uid;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialize ticket on mount
    setTicket(generateTicket());
  }, []);

  const resetGame = () => {
    setGameStatus('idle');
    setCalledNumbers([]);
    setCurrentNumber(null);
    setDabbedNumbers([]);
    setClaimedPrizes([]);
    setTicket(generateTicket());
  }

  const handleNextNumber = useCallback(async () => {
    if (calledNumbers.length >= 90) {
      toast({ title: 'Game Over!', description: 'All numbers have been called.' });
      setGameStatus('ended');
      if (currentGameId && firestore) {
        try {
          await updateDoc(doc(firestore, 'tambola_games', currentGameId), {
            status: 'ended',
          });
        } catch (error) {
          console.error('Error updating game status:', error);
        }
      }
      return;
    }

    let nextNumber;
    do {
      nextNumber = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.includes(nextNumber));

    const newCalledNumbers = [...calledNumbers, nextNumber];
    setCalledNumbers(newCalledNumbers);
    setCurrentNumber(nextNumber);

    // Update Firestore if admin
    if (currentGameId && firestore && isGameAdmin) {
      try {
        await updateDoc(doc(firestore, 'tambola_games', currentGameId), {
          calledNumbers: newCalledNumbers,
          currentNumber: nextNumber,
          status: 'running',
        });
      } catch (error) {
        console.error('Error updating game:', error);
      }
    }
  }, [calledNumbers, toast, currentGameId, firestore, isGameAdmin]);

  // Check for pending game start after payment
  useEffect(() => {
    const startGame = searchParams.get('startGame');
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');
    
    if (startGame === 'true' && user) {
      // Get pending game data from localStorage or URL params
      const pendingTambola = localStorage.getItem('pending_tambola_game');
      
      let gameOrderId = orderId;
      let gamePaymentId = paymentId;
      
      if (pendingTambola) {
        try {
          const { orderId: storedOrderId, paymentId: storedPaymentId } = JSON.parse(pendingTambola);
          // Use stored values if URL params are missing
          if (!gameOrderId) gameOrderId = storedOrderId;
          if (!gamePaymentId) gamePaymentId = storedPaymentId;
        } catch (e) {
          console.error('Error parsing pending tambola game:', e);
        }
      }
      
      // If we have orderId (from URL or localStorage), proceed with setup
      if (gameOrderId) {
        // Check if game already exists for this orderId
        const checkExistingGame = async () => {
          if (!firestore) return;
          
          try {
            const gamesQuery = query(
              collection(firestore, 'tambola_games'),
              where('orderId', '==', gameOrderId)
            );
            const gamesSnapshot = await getDocs(gamesQuery);
            
            if (!gamesSnapshot.empty) {
              // Game already exists, load it
              const existingGame = gamesSnapshot.docs[0];
              setCurrentGameId(existingGame.id);
              if (typeof window !== 'undefined') {
                localStorage.setItem('current_tambola_game_id', existingGame.id);
                localStorage.removeItem('pending_tambola_game');
              }
              router.replace('/dashboard/tambola');
              toast({
                title: 'Game Found',
                description: 'Your game has been loaded.',
              });
              return;
            }
            
            // Game doesn't exist, open setup dialog
            setPendingGameData({ 
              orderId: gameOrderId, 
              paymentId: gamePaymentId || '' 
            });
            setIsSetupDialogOpen(true);
            router.replace('/dashboard/tambola');
          } catch (error) {
            console.error('Error checking existing game:', error);
            // Fallback: open setup dialog anyway
            setPendingGameData({ 
              orderId: gameOrderId, 
              paymentId: gamePaymentId || '' 
            });
            setIsSetupDialogOpen(true);
            router.replace('/dashboard/tambola');
          }
        };
        
        checkExistingGame();
      }
    }
  }, [searchParams, router, user, firestore, toast]);

  // Handle game setup completion
  const handleSetupComplete = async (config: {
    prizes: {
      corners?: number;
      topLine?: number;
      middleLine?: number;
      bottomLine?: number;
      fullHouse?: number;
      houses?: number[];
    };
    scheduledDate: string;
    scheduledTime: string;
  }) => {
    if (!firestore || !user || !pendingGameData) return;

    try {
      const shareLink = `${window.location.origin}/dashboard/tambola?join=${pendingGameData.orderId}`;
      
      const newGame = {
        adminId: user.uid,
        playerIds: [user.uid], // Admin is first player
        calledNumbers: [],
        currentNumber: null,
        status: 'idle' as const,
        createdAt: serverTimestamp(),
        orderId: pendingGameData.orderId,
        paymentId: pendingGameData.paymentId,
        prizes: config.prizes,
        scheduledDate: config.scheduledDate,
        scheduledTime: config.scheduledTime,
        isConfigured: true,
        shareLink: shareLink,
      };
      
      const gameDoc = await addDoc(collection(firestore, 'tambola_games'), newGame);
      setCurrentGameId(gameDoc.id);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_tambola_game_id', gameDoc.id);
        localStorage.removeItem('pending_tambola_game');
      }
      
      setIsSetupDialogOpen(false);
      setPendingGameData(null);
      
      // Show social share dialog
      setIsShareDialogOpen(true);
      
      toast({ 
        title: 'Game Created Successfully!', 
        description: 'Share the game link to invite players.' 
      });
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: 'Error',
        description: 'Failed to create game. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Sync game state with Firestore
  useEffect(() => {
    if (currentGame?.id) {
      setCalledNumbers(currentGame.calledNumbers || []);
      setCurrentNumber(currentGame.currentNumber);
      setGameStatus(currentGame.status);
      if (currentGame.id !== currentGameId) {
        setCurrentGameId(currentGame.id);
      }
    }
  }, [currentGame?.id, currentGame?.calledNumbers, currentGame?.currentNumber, currentGame?.status, currentGameId]);

  // Search for users to invite
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { results } = await searchUsers(searchTerm);
        // Filter out users who are already players
        const existingPlayerIds = new Set(currentGame?.playerIds || []);
        const filteredResults = results
          .filter(result => result.type === 'user' && !existingPlayerIds.has(result.id))
          .map(result => ({
            id: result.id,
            name: result.title,
            avatar: result.image || '',
            city: result.metadata?.city || '',
          } as User));
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search for users',
          variant: 'destructive',
        });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, currentGame?.playerIds, toast]);

  const handleAddPlayer = async (userId: string, userName: string) => {
    if (!firestore || !currentGameId) {
      toast({
        title: 'Error',
        description: 'Unable to add player. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingPlayer(userId);
    try {
      const gameRef = doc(firestore, 'tambola_games', currentGameId);
      await updateDoc(gameRef, {
        playerIds: arrayUnion(userId),
      });
      
      toast({
        title: 'Player Added!',
        description: `${userName} has been added to the game.`,
      });
      
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      setSearchTerm('');
    } catch (error: any) {
      console.error('Error adding player:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add player. You may not have permission.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingPlayer(null);
    }
  };

  const shareLink = currentGame?.shareLink || (typeof window !== 'undefined' && currentGameId
    ? `${window.location.origin}/dashboard/tambola?join=${currentGameId}`
    : '');

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      toast({
        title: 'Link Copied!',
        description: 'Share this link via WhatsApp or any other platform to invite players.',
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Failed to Copy',
        description: 'Could not copy the link to your clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleShareWhatsApp = () => {
    if (!shareLink) return;
    const prizeInfo = currentGame?.prizes ? 
      `\n💰 Prizes:\n${currentGame.prizes.corners ? `Four Corners: ₹${currentGame.prizes.corners}\n` : ''}${currentGame.prizes.topLine ? `Top Line: ₹${currentGame.prizes.topLine}\n` : ''}${currentGame.prizes.middleLine ? `Middle Line: ₹${currentGame.prizes.middleLine}\n` : ''}${currentGame.prizes.bottomLine ? `Bottom Line: ₹${currentGame.prizes.bottomLine}\n` : ''}${currentGame.prizes.fullHouse ? `Full House: ₹${currentGame.prizes.fullHouse}\n` : ''}${currentGame.prizes.houses?.map((h, i) => `House ${i + 1}: ₹${h}`).join('\n') || ''}` : '';
    const scheduleInfo = currentGame?.scheduledDate && currentGame?.scheduledTime ?
      `\n📅 Scheduled: ${new Date(currentGame.scheduledDate).toLocaleDateString()} at ${currentGame.scheduledTime}` : '';
    const message = `🎲 Join my Tambola game on Naarimani!${prizeInfo}${scheduleInfo}\n\n${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareFacebook = () => {
    if (!shareLink) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    if (!shareLink) return;
    const text = `🎲 Join my Tambola game on Naarimani! ${shareLink}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  const handleStartGame = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    try {
      // Get Firebase Auth token
      const { getAuth } = await import('firebase/auth');
      const { initializeFirebase } = await import('@/firebase');
      const auth = initializeFirebase().auth;
      let authToken: string | null = null;
      
      if (auth.currentUser) {
        authToken = await auth.currentUser.getIdToken();
      }

      // Create payment order
      const { processCashfreePayment } = await import('@/lib/payments');
      const paymentResponse = await processCashfreePayment(
        1,
        'INR',
        'Tambola Game - Single Game Payment',
        user.uid,
        {
          name: user.displayName || 'User',
          email: user.email || '',
          phone: '9999999999',
        },
        {
          subscriptionType: 'tambola',
          type: 'tambola_game',
          duration: 'per game',
        },
        authToken || undefined
      );

      // Store pending game start in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_tambola_game', JSON.stringify({
          orderId: paymentResponse.orderId,
          paymentId: paymentResponse.paymentId,
        }));
      }

      // Redirect to payment URL if available
      if (paymentResponse.paymentUrl) {
        window.location.href = paymentResponse.paymentUrl;
        return;
      }

      // If payment session ID is available, use Cashfree Checkout.js
      if (paymentResponse.paymentSessionId) {
        // Load Cashfree SDK and redirect
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => {
          const isProduction = process.env.NODE_ENV === 'production' || 
                              window.location.hostname !== 'localhost';
          const cashfree = new (window as any).Cashfree({ 
            mode: isProduction ? 'production' : 'sandbox' 
          });
          cashfree.checkout({
            paymentSessionId: paymentResponse.paymentSessionId,
            redirectTarget: '_self',
          });
        };
        document.body.appendChild(script);
        return;
      }

      toast({
        title: 'Payment Error',
        description: 'Payment URL not available. Please try again.',
        variant: 'destructive',
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    }
  };

  const handleDabNumber = (number: number) => {
    if (!isNumberCalled(number)) {
      toast({ variant: 'destructive', title: 'Not Called Yet!', description: `Number ${number} hasn't been called.`});
      return;
    }
    if (dabbedNumbers.includes(number)) {
      setDabbedNumbers(dabbedNumbers.filter(n => n !== number));
    } else {
      setDabbedNumbers([...dabbedNumbers, number]);
    }
  };

  const checkPrize = (prizeId: string) => {
    const ticketNumbers = ticket.flat().filter(n => n !== null) as number[];

    const getRowNumbers = (row: number) => ticket[row].filter(n => n !== null) as number[];

    let prizeNumbers: number[] = [];
    switch (prizeId) {
        case 'top_line': prizeNumbers = getRowNumbers(0); break;
        case 'middle_line': prizeNumbers = getRowNumbers(1); break;
        case 'bottom_line': prizeNumbers = getRowNumbers(2); break;
        case 'full_house': prizeNumbers = ticketNumbers; break;
        case 'corners': 
            const corners: number[] = [];
            const firstRow = getRowNumbers(0);
            const lastRow = getRowNumbers(2);
            if(firstRow.length > 0) corners.push(firstRow[0]);
            if(firstRow.length > 1) corners.push(firstRow[firstRow.length - 1]);
            if(lastRow.length > 0) corners.push(lastRow[0]);
            if(lastRow.length > 1) corners.push(lastRow[lastRow.length - 1]);
            prizeNumbers = Array.from(new Set(corners)); // handle case where corners are same number
            break;
    }

    const allDabbed = prizeNumbers.every(n => dabbedNumbers.includes(n));
    const allCalled = prizeNumbers.every(n => calledNumbers.includes(n));

    if (allDabbed && allCalled) {
        if (!claimedPrizes.includes(prizeId)) {
            setClaimedPrizes([...claimedPrizes, prizeId]);
            toast({ title: '🎉 Claim Verified!', description: `You have successfully claimed "${prizes.find(p => p.id === prizeId)?.name}"!` });
        } else {
            toast({ variant: 'destructive', title: 'Already Claimed', description: 'You have already claimed this prize.' });
        }
    } else {
        toast({ variant: 'destructive', title: 'Bogey!', description: 'Your claim is not valid. Check your ticket again.' });
    }
  };
  
  const isNumberCalled = (number: number | null) => number !== null && calledNumbers.includes(number);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online Tambola"
        description="Join the fun and win exciting prizes!"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Game Area */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="flex flex-col items-center justify-center p-6 text-center bg-primary text-primary-foreground">
            <CardDescription className="text-lg text-primary-foreground/80">Current Number</CardDescription>
            <div className="font-bold text-8xl tracking-tighter text-primary-foreground">
              {currentNumber || '--'}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tambola Board</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 90 }, (_, i) => i + 1).map((number) => (
                  <div
                    key={number}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-all',
                      isNumberCalled(number)
                        ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                        : 'bg-muted/50'
                    )}
                  >
                    {number}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Players Card */}
          {currentGame && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-primary" /> Players ({currentGame.playerIds?.length || 0})
                  </CardTitle>
                  {isGameAdmin && (
                    <div className="flex gap-2">
                      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4 mr-1" /> Share
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Share Tambola Game</DialogTitle>
                            <DialogDescription>
                              Share this link to invite players. Anyone with this link can join your game.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2">
                              <Input
                                value={shareLink}
                                readOnly
                                className="flex-1 font-mono text-sm"
                              />
                              <Button
                                onClick={handleCopyLink}
                                variant={linkCopied ? 'default' : 'outline'}
                                size="icon"
                              >
                                {linkCopied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <Button onClick={handleShareWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white" variant="outline">
                                <Share2 className="mr-2 h-4 w-4" /> Share via WhatsApp
                              </Button>
                              <Button onClick={handleShareFacebook} className="w-full bg-blue-600 hover:bg-blue-700 text-white" variant="outline">
                                <Share2 className="mr-2 h-4 w-4" /> Share on Facebook
                              </Button>
                              <Button onClick={handleShareTwitter} className="w-full bg-blue-400 hover:bg-blue-500 text-white" variant="outline">
                                <Share2 className="mr-2 h-4 w-4" /> Share on Twitter
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              💡 Tip: Share this link on WhatsApp, social media, or any platform. Players can join instantly by clicking the link!
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-1" /> Invite
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Invite Players to Tambola Game</DialogTitle>
                          <DialogDescription>
                            Search for users by name or city to add them to your game.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by name or city..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          
                          {isSearching && (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}

                          {!isSearching && searchResults.length > 0 && (
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-2">
                                {searchResults.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={player.avatar} alt={player.name} />
                                        <AvatarFallback>
                                          {player.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{player.name}</p>
                                        {player.city && (
                                          <p className="text-xs text-muted-foreground">{player.city}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddPlayer(player.id, player.name)}
                                      disabled={isAddingPlayer === player.id}
                                    >
                                      {isAddingPlayer === player.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <UserPlus className="h-4 w-4 mr-1" />
                                          Add
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          )}

                          {!isSearching && searchTerm && searchResults.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No users found matching &quot;{searchTerm}&quot;</p>
                            </div>
                          )}

                          {!isSearching && !searchTerm && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>Start typing to search for users</p>
                            </div>
                          )}
                        </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {players && players.length > 0 ? (
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{player.name}</p>
                          {player.id === currentGame.adminId && (
                            <p className="text-xs text-muted-foreground">Admin</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No players yet. {isGameAdmin && 'Invite players to join!'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="text-amber-500" /> Host Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleStartGame} 
                disabled={gameStatus === 'running' || !!currentGame || isSetupDialogOpen || !!pendingGameData}
              >
                Pay ₹1 & Start Game
              </Button>
              <Button onClick={handleNextNumber} disabled={gameStatus !== 'running' || !isGameAdmin}>Next Number</Button>
              <Button variant="outline" disabled={gameStatus !== 'running'}>Pause Game</Button>
              <Button variant="destructive" onClick={resetGame} disabled={gameStatus === 'idle'}>End Game</Button>
            </CardContent>
          </Card>

          {isGameAdmin && currentGameId && (
            <JoinRequestsManager
              type="tambola"
              gameOrGroupId={currentGameId}
              adminId={currentGame?.adminId || user?.uid || ''}
            />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="text-primary" /> How to Play
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-decimal pl-4 space-y-1">
                <li>Click <strong>Start New</strong> to begin a new game.</li>
                <li>As numbers are announced, check your ticket below.</li>
                <li>If a called number is on your ticket, click on it to &quot;dab&quot; it. It will be marked.</li>
                <li>When you complete a prize pattern (e.g., Top Line), click the corresponding <strong>Claim</strong> button.</li>
                <li>The system will verify your claim. Good luck!</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-9 gap-1 rounded-lg bg-secondary p-2">
                {ticket.flat().map((number, index) => (
                  <button
                    key={index}
                    disabled={!number || gameStatus !== 'running'}
                    onClick={() => number && handleDabNumber(number)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-sm font-bold transition-all disabled:cursor-not-allowed',
                      number
                        ? 'bg-background'
                        : 'bg-secondary',
                      dabbedNumbers.includes(number!) && isNumberCalled(number)
                        ? 'bg-accent text-accent-foreground line-through decoration-2 opacity-75'
                        : '',
                       isNumberCalled(number) && !dabbedNumbers.includes(number!)
                        ? 'animate-pulse border-2 border-primary' : ''
                    )}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
           
          <Card>
              <CardHeader>
                  <CardTitle>Prizes to Claim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  {/* Display all standard prizes */}
                  {prizes.map(prize => {
                    const prizeAmount = currentGame?.prizes?.[prize.id as keyof typeof currentGame.prizes] as number | undefined;
                    return (
                      <div key={prize.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                            <p className="font-semibold">{prize.name}</p>
                            <p className="text-xs text-muted-foreground">{prize.description}</p>
                            {prizeAmount !== undefined && prizeAmount > 0 && (
                              <p className="text-sm font-bold text-primary mt-1">₹{prizeAmount.toLocaleString()}</p>
                            )}
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant={claimedPrizes.includes(prize.id) ? 'secondary' : 'default'} disabled={gameStatus !== 'running' || claimedPrizes.includes(prize.id)}>
                                    <Award className="mr-2 h-4 w-4" />
                                    {claimedPrizes.includes(prize.id) ? 'Claimed' : 'Claim'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Claim for &quot;{prize.name}&quot;?</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <p>The system will verify if you have completed this prize. False claims may lead to disqualification.</p>
                                </div>
                                <Button onClick={() => checkPrize(prize.id)}>Yes, Check My Ticket!</Button>
                            </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                  
                  {/* Display multiple houses if configured */}
                  {currentGame?.prizes?.houses && currentGame.prizes.houses.length > 0 && (
                    <>
                      {currentGame.prizes.houses.map((houseAmount, index) => {
                        const houseId = `house_${index + 1}`;
                        return (
                          <div key={houseId} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex-1">
                                <p className="font-semibold">House {index + 1}</p>
                                <p className="text-xs text-muted-foreground">Complete all 15 numbers on your ticket</p>
                                {houseAmount > 0 && (
                                  <p className="text-sm font-bold text-primary mt-1">₹{houseAmount.toLocaleString()}</p>
                                )}
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant={claimedPrizes.includes(houseId) ? 'secondary' : 'default'} 
                                      disabled={gameStatus !== 'running' || claimedPrizes.includes(houseId)}
                                    >
                                        <Award className="mr-2 h-4 w-4" />
                                        {claimedPrizes.includes(houseId) ? 'Claimed' : 'Claim'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Confirm Claim for &quot;House {index + 1}&quot;?</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <p>The system will verify if you have completed all 15 numbers on your ticket. False claims may lead to disqualification.</p>
                                    </div>
                                    <Button onClick={() => checkPrize('full_house')}>Yes, Check My Ticket!</Button>
                                </DialogContent>
                            </Dialog>
                          </div>
                        );
                      })}
                    </>
                  )}
              </CardContent>
          </Card>

        </div>

      </div>

      {/* Setup Dialog */}
      <TambolaSetupDialog
        isOpen={isSetupDialogOpen}
        onClose={() => {
          setIsSetupDialogOpen(false);
          setPendingGameData(null);
        }}
        onComplete={handleSetupComplete}
      />
    </div>
  );
}

    