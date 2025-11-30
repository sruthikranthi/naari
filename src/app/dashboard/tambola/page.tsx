
'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { Crown, Ticket, Users, Clock, PartyPopper, Award, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUser } from '@/firebase/provider';

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
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [ticket, setTicket] = useState<(number | null)[][]>([]);
  const [dabbedNumbers, setDabbedNumbers] = useState<number[]>([]);
  const [claimedPrizes, setClaimedPrizes] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'paused' | 'ended'>('idle');

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

  const handleNextNumber = useCallback(() => {
    if (calledNumbers.length >= 90) {
      toast({ title: 'Game Over!', description: 'All numbers have been called.' });
      setGameStatus('ended');
      return;
    }

    let nextNumber;
    do {
      nextNumber = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.includes(nextNumber));

    setCalledNumbers((prev) => [...prev, nextNumber]);
    setCurrentNumber(nextNumber);
  }, [calledNumbers, toast]);

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
        99,
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="text-amber-500" /> Host Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button onClick={handleStartGame} disabled={gameStatus === 'running'}>Pay ₹99 & Start Game</Button>
              <Button onClick={handleNextNumber} disabled={gameStatus !== 'running'}>Next Number</Button>
              <Button variant="outline" disabled={gameStatus !== 'running'}>Pause Game</Button>
              <Button variant="destructive" onClick={resetGame} disabled={gameStatus === 'idle'}>End Game</Button>
            </CardContent>
          </Card>
          
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
                  {prizes.map(prize => (
                      <div key={prize.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="font-semibold">{prize.name}</p>
                            <p className="text-xs text-muted-foreground">{prize.description}</p>
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
                  ))}
              </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}

    