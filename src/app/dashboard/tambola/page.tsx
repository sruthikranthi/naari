
'use client';
import { useState } from 'react';
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
import { Crown, Ticket, Users, Clock } from 'lucide-react';

// Mock ticket data
const mockTicket = [
  [3, null, 21, 34, null, 55, 68, null, 81],
  [null, 15, 25, null, 46, 58, null, 77, 88],
  [9, 18, null, 39, 49, null, 69, 79, null],
];

export default function TambolaPage() {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);

  const handleNextNumber = () => {
    let nextNumber;
    do {
      nextNumber = Math.floor(Math.random() * 90) + 1;
    } while (calledNumbers.includes(nextNumber));

    setCalledNumbers([...calledNumbers, nextNumber]);
    setCurrentNumber(nextNumber);
  };

  const isNumberCalled = (number: number) => {
    return calledNumbers.includes(number);
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
                      'flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold',
                      isNumberCalled(number)
                        ? 'bg-primary text-primary-foreground'
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
              <Button>Start Game</Button>
              <Button onClick={handleNextNumber}>Next Number</Button>
              <Button variant="outline">Pause Game</Button>
              <Button variant="destructive">End Game</Button>
            </CardContent>
          </Card>

          {/* Your Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Your Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-9 gap-1 rounded-lg bg-secondary p-2">
                {mockTicket.flat().map((number, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-sm font-bold',
                      number
                        ? isNumberCalled(number)
                          ? 'bg-accent text-accent-foreground line-through'
                          : 'bg-background'
                        : 'bg-secondary'
                    )}
                  >
                    {number}
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full">Claim Prize</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
