'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import type { FantasyQuestion, PredictionType } from '@/lib/fantasy/types';

interface PredictionFormProps {
  question: FantasyQuestion;
  onSubmit: (prediction: string | number, rangeMin?: number, rangeMax?: number) => void;
  isSubmitting?: boolean;
  existingPrediction?: string | number;
  existingRange?: { min?: number; max?: number };
}

export function PredictionForm({
  question,
  onSubmit,
  isSubmitting = false,
  existingPrediction,
  existingRange,
}: PredictionFormProps) {
  const [prediction, setPrediction] = useState<string | number>(
    existingPrediction || (question.predictionType === 'up-down' ? 'up' : '')
  );
  const [rangeValue, setRangeValue] = useState<number[]>(
    existingRange
      ? [existingRange.min || question.minValue || 0, existingRange.max || question.maxValue || 1000]
      : [question.minValue || 0, question.maxValue || 1000]
  );
  const [customValue, setCustomValue] = useState<string>(
    existingPrediction && typeof existingPrediction === 'number' 
      ? String(existingPrediction) 
      : ''
  );

  const handleSubmit = () => {
    if (question.predictionType === 'range') {
      onSubmit(customValue || rangeValue[0], rangeValue[0], rangeValue[1]);
    } else {
      onSubmit(prediction);
    }
  };

  const canSubmit = () => {
    if (question.predictionType === 'multiple-choice') {
      return prediction !== '';
    }
    if (question.predictionType === 'up-down') {
      return prediction === 'up' || prediction === 'down';
    }
    if (question.predictionType === 'range') {
      return rangeValue[0] < rangeValue[1];
    }
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.question}</CardTitle>
        {question.unit && (
          <CardDescription>
            Unit: {question.unit}
          </CardDescription>
        )}
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">
            {question.exactMatchPoints} pts for exact match
          </Badge>
          {question.nearRangePoints && (
            <Badge variant="outline">
              {question.nearRangePoints} pts for close match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Up/Down Prediction */}
        {question.predictionType === 'up-down' && (
          <div className="space-y-4">
            <Label>Will the price go up or down?</Label>
            <RadioGroup
              value={String(prediction)}
              onValueChange={(value) => setPrediction(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="up" id="up" className="peer sr-only" />
                <Label
                  htmlFor="up"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <TrendingUp className="mb-3 h-8 w-8 text-green-500" />
                  <span className="font-semibold">Up</span>
                  <span className="text-xs text-muted-foreground">Price will increase</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="down" id="down" className="peer sr-only" />
                <Label
                  htmlFor="down"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <TrendingDown className="mb-3 h-8 w-8 text-red-500" />
                  <span className="font-semibold">Down</span>
                  <span className="text-xs text-muted-foreground">Price will decrease</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Multiple Choice Prediction */}
        {question.predictionType === 'multiple-choice' && question.options && (
          <div className="space-y-4">
            <Label>Select your prediction:</Label>
            <RadioGroup
              value={String(prediction)}
              onValueChange={(value) => setPrediction(value)}
              className="grid grid-cols-1 gap-3"
            >
              {question.options.map((option, index) => (
                <div key={index}>
                  <RadioGroupItem value={option} id={`option-${index}`} className="peer sr-only" />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="font-medium">{option}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Range Prediction */}
        {question.predictionType === 'range' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Select price range:</Label>
              <div className="px-2">
                <Slider
                  value={rangeValue}
                  onValueChange={setRangeValue}
                  min={question.minValue || 0}
                  max={question.maxValue || 10000}
                  step={question.unit === '₹' ? 100 : 1}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-value">Minimum {question.unit}</Label>
                  <Input
                    id="min-value"
                    type="number"
                    value={rangeValue[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= (question.minValue || 0) && val < rangeValue[1]) {
                        setRangeValue([val, rangeValue[1]]);
                      }
                    }}
                    min={question.minValue || 0}
                    max={rangeValue[1] - 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-value">Maximum {question.unit}</Label>
                  <Input
                    id="max-value"
                    type="number"
                    value={rangeValue[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= (question.maxValue || 10000) && val > rangeValue[0]) {
                        setRangeValue([rangeValue[0], val]);
                      }
                    }}
                    min={rangeValue[0] + 1}
                    max={question.maxValue || 10000}
                  />
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your prediction: {question.unit}{rangeValue[0]} - {question.unit}{rangeValue[1]}
                </p>
              </div>
            </div>

            {/* Optional: Single value prediction within range */}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="exact-value">
                Or enter exact value (optional):
              </Label>
              <Input
                id="exact-value"
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={`Enter value between ${rangeValue[0]} and ${rangeValue[1]}`}
                min={rangeValue[0]}
                max={rangeValue[1]}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Submitting...
            </>
          ) : existingPrediction ? (
            'Update Prediction'
          ) : (
            'Submit Prediction'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

