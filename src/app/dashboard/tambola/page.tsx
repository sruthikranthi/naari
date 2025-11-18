
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
import { Crown, Ticket, Users, Clock, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Function to generate a valid Tambola ticket
const generateTicket = (): (number | null)[][] => {
  const ticket: (number | null)[][] = Array.from({ length: 3 }, () => Array(9).fill(null));
  const columns: number[][] = Array.from({ length: 9 }, () => []);

  // Populate columns with numbers
  for (let i = 0; i < 9; i++) {
    const start = i * 10 + 1;
    const end = i === 8 ? 90 : i * 10 + 10;
    const nums = [];
    for (let j = start; j <= end; j++) {
      nums.push(j);
    }
    columns[i] = nums;
  }

  // Place 15 numbers on the ticket
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      let col;
      do {
        col = Math.floor(Math.random() * 9);
      } while (ticket[row][col] !== null);

      const availableNumbers = columns[col];
      const numIndex = Math.floor(Math.random() * availableNumbers.length);
      const num = availableNumbers.splice(numIndex, 1)[0];
      ticket[row][col] = num;
    }
  }

  // Sort numbers within each column
  for (let col = 0; col < 9; col++) {
    const columnNumbers: number[] = [];
    for (let row = 0; row < 3; row++) {
        if(ticket[row][col] !== null) {
            columnNumbers.push(ticket[row][col] as number);
        }
    }
    columnNumbers.sort((a, b) => a - b);
    let currentNumIndex = 0;
    for (let row = 0; row < 3; row++) {
        if(ticket[row][col] !== null) {
            ticket[row][col] = columnNumbers[currentNumIndex++];
        }
    }
  }

  return ticket;
};


export default function TambolaPage() {
  const { toast } = useToast();
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [ticket, setTicket] = useState<(number|null)[][]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'running' | 'paused' | 'ended'>('idle');

  useEffect(() => {
    setTicket(generateTicket());
  }, []);

  const handleNextNumber = useCallback(() => {
    if (calledNumbers.length >= 90) {
        toast({ title: "Game Over!", description: "All numbers have been called."});
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

  const handleStartGame = () => {
    setGameStatus('running');
    setCalledNumbers([]);
    setCurrentNumber(null);
    setTicket(generateTicket());
    handleNextNumber();
  };

  const handleEndGame = () => {
    setGameStatus('idle');
    setCalledNumbers([]);
    setCurrentNumber(null);
  }

  const isNumberCalled = (number: number | null) => {
    return number !== null && calledNumbers.includes(number);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online Tambola"
        description="Join the fun and win exciting prizes!"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Game Area */}
        <div className="space-y-6 lg:col-span-2">
          {/* Number Caller */}
          <Card className="flex flex-col items-center justify-center p-6 text-center bg-primary text-primary-foreground">
            <CardDescription className="text-lg">Current Number</CardDescription>
            <div className="font-bold text-8xl tracking-tighter">
              {currentNumber || '--'}
            </div>
          </Card>

          {/* Game Board */}
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
          {/* Game Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="text-amber-500" /> Host Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button onClick={handleStartGame} disabled={gameStatus === 'running'}>Start Game</Button>
              <Button onClick={handleNextNumber} disabled={gameStatus !== 'running'}>Next Number</Button>
              <Button variant="outline" disabled={gameStatus !== 'running'}>Pause Game</Button>
              <Button variant="destructive" onClick={handleEndGame} disabled={gameStatus === 'idle'}>End Game</Button>
            </CardContent>
          </Card>

          {/* Your Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Your Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-9 gap-1 rounded-lg bg-secondary p-2">
                {ticket.flat().map((number, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-sm font-bold transition-all',
                      number
                        ? isNumberCalled(number)
                          ? 'bg-accent text-accent-foreground line-through decoration-2'
                          : 'bg-background'
                        : 'bg-secondary'
                    )}
                  >
                    {number}
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" disabled={gameStatus !== 'running'}>
                <PartyPopper className="mr-2 h-4 w-4" /> Claim Prize
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
