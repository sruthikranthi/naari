'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Award, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TambolaSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: {
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
  }) => void;
}

export function TambolaSetupDialog({ isOpen, onClose, onComplete }: TambolaSetupDialogProps) {
  const { toast } = useToast();
  const [prizes, setPrizes] = useState({
    corners: '',
    topLine: '',
    middleLine: '',
    bottomLine: '',
    fullHouse: '',
  });
  const [houses, setHouses] = useState<string[]>(['']);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleAddHouse = () => {
    setHouses([...houses, '']);
  };

  const handleRemoveHouse = (index: number) => {
    setHouses(houses.filter((_, i) => i !== index));
  };

  const handleHouseChange = (index: number, value: string) => {
    const newHouses = [...houses];
    newHouses[index] = value;
    setHouses(newHouses);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!scheduledDate || !scheduledTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please set the scheduled date and time for the game.',
      });
      return;
    }

    // Convert prize strings to numbers
    const prizeConfig: any = {};
    if (prizes.corners) prizeConfig.corners = parseFloat(prizes.corners);
    if (prizes.topLine) prizeConfig.topLine = parseFloat(prizes.topLine);
    if (prizes.middleLine) prizeConfig.middleLine = parseFloat(prizes.middleLine);
    if (prizes.bottomLine) prizeConfig.bottomLine = parseFloat(prizes.bottomLine);
    if (prizes.fullHouse) prizeConfig.fullHouse = parseFloat(prizes.fullHouse);

    // Convert house prizes to numbers
    const housePrizes = houses
      .map(h => h.trim())
      .filter(h => h !== '')
      .map(h => parseFloat(h))
      .filter(p => !isNaN(p) && p > 0);

    if (housePrizes.length > 0) {
      prizeConfig.houses = housePrizes;
    }

    // Check if at least one prize is set
    if (Object.keys(prizeConfig).length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Prizes Set',
        description: 'Please set at least one prize amount for the game.',
      });
      return;
    }

    onComplete({
      prizes: prizeConfig,
      scheduledDate,
      scheduledTime,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Configure Your Tambola Game
          </DialogTitle>
          <DialogDescription>
            Set up prize money, schedule, and game details. Players will see this information when they join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prize Money Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prize Money (₹)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="corners">Four Corners</Label>
                  <Input
                    id="corners"
                    type="number"
                    placeholder="0"
                    value={prizes.corners}
                    onChange={(e) => setPrizes({ ...prizes, corners: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topLine">Top Line</Label>
                  <Input
                    id="topLine"
                    type="number"
                    placeholder="0"
                    value={prizes.topLine}
                    onChange={(e) => setPrizes({ ...prizes, topLine: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleLine">Middle Line</Label>
                  <Input
                    id="middleLine"
                    type="number"
                    placeholder="0"
                    value={prizes.middleLine}
                    onChange={(e) => setPrizes({ ...prizes, middleLine: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottomLine">Bottom Line</Label>
                  <Input
                    id="bottomLine"
                    type="number"
                    placeholder="0"
                    value={prizes.bottomLine}
                    onChange={(e) => setPrizes({ ...prizes, bottomLine: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullHouse">Full House</Label>
                  <Input
                    id="fullHouse"
                    type="number"
                    placeholder="0"
                    value={prizes.fullHouse}
                    onChange={(e) => setPrizes({ ...prizes, fullHouse: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Multiple Houses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Multiple Houses (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddHouse}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add House
                  </Button>
                </div>
                <div className="space-y-2">
                  {houses.map((house, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder={`House ${index + 1} prize (₹)`}
                        value={house}
                        onChange={(e) => handleHouseChange(index, e.target.value)}
                        min="0"
                        step="0.01"
                        className="flex-1"
                      />
                      {houses.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveHouse(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add multiple house prizes (1st house, 2nd house, etc.)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Game Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Complete Setup & Start Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

