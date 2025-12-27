'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, Image as ImageIcon, Loader } from 'lucide-react';
import { createFantasyGame, createFantasyQuestion } from '@/lib/fantasy/services';
import { getAllSponsors } from '@/lib/ads/services';
import type { Sponsor } from '@/lib/ads/types';
import type { FantasyGameType, FantasyCategory, PredictionType } from '@/lib/fantasy/types';
import { Timestamp } from 'firebase/firestore';
import Image from 'next/image';

interface QuestionForm {
  order: number;
  question: string;
  predictionType: PredictionType;
  imageUrl?: string;
  imageDescription?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  unit?: string;
  exactMatchPoints: number;
  nearRangePoints?: number;
  nearRangeTolerance?: number;
  eventSponsorId?: string;
}

interface CreateGameFormProps {
  firestore: Firestore;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

export function CreateGameForm({ firestore, userId, onSuccess, onCancel, toast }: CreateGameFormProps) {
  const storage = useStorage();
  const [loading, setLoading] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Game form state
  const [gameForm, setGameForm] = useState({
    title: '',
    description: '',
    category: 'price-prediction' as FantasyCategory,
    gameType: 'gold-ornament-price' as FantasyGameType,
    entryCoins: 10,
    startTime: '',
    endTime: '',
    resultRevealTime: '',
    mainSponsorId: '',
    imageUrl: '',
  });

  // Questions/Events state (10-18 events)
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      order: 1,
      question: '',
      predictionType: 'up-down',
      exactMatchPoints: 100,
    },
  ]);

  // Load sponsors on mount
  useEffect(() => {
    const loadSponsors = async () => {
      try {
        const allSponsors = await getAllSponsors(firestore).catch(() => []);
        setSponsors(allSponsors);
      } catch (error) {
        console.error('Error loading sponsors:', error);
        setSponsors([]);
      }
    };
    if (firestore) {
      loadSponsors();
    }
  }, [firestore]);

  const handleAddQuestion = () => {
    if (questions.length >= 18) {
      toast({
        variant: 'destructive',
        title: 'Maximum Questions',
        description: 'You can add up to 18 questions per game.',
      });
      return;
    }
    setQuestions([
      ...questions,
      {
        order: questions.length + 1,
        question: '',
        predictionType: 'up-down',
        exactMatchPoints: 100,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 10) {
      toast({
        variant: 'destructive',
        title: 'Minimum Questions',
        description: 'Each game must have at least 10 questions.',
      });
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reorder
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });
    setQuestions(newQuestions);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<QuestionForm>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleImageUpload = async (questionIndex: number, file: File) => {
    if (!storage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Storage not available.',
      });
      return;
    }

    setUploadingImage(`question-${questionIndex}`);
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `fantasy-questions/${userId}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      handleUpdateQuestion(questionIndex, { imageUrl: downloadURL });
      toast({
        title: 'Image Uploaded',
        description: 'Question image uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image.',
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (questions.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Each game must have at least 10 questions/events.',
      });
      return;
    }

    if (questions.some(q => !q.question.trim())) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'All questions must have a question text.',
      });
      return;
    }

    setLoading(true);
    try {
      // Create game
      const gameData = {
        title: gameForm.title,
        description: gameForm.description,
        category: gameForm.category,
        gameType: gameForm.gameType,
        status: 'active' as const,
        startTime: Timestamp.fromDate(new Date(gameForm.startTime)),
        endTime: Timestamp.fromDate(new Date(gameForm.endTime)),
        resultRevealTime: Timestamp.fromDate(new Date(gameForm.resultRevealTime)),
        entryCoins: gameForm.entryCoins,
        tags: [gameForm.gameType, gameForm.category],
        createdBy: userId,
        ...(gameForm.mainSponsorId && { mainSponsorId: gameForm.mainSponsorId }),
        ...(gameForm.imageUrl && { imageUrl: gameForm.imageUrl }),
      };

      const gameId = await createFantasyGame(firestore, gameData);

      // Create all questions/events
      for (const question of questions) {
        const questionData: any = {
          gameId,
          question: question.question,
          predictionType: question.predictionType,
          order: question.order,
          exactMatchPoints: question.exactMatchPoints,
          ...(question.imageUrl && { imageUrl: question.imageUrl }),
          ...(question.imageDescription && { imageDescription: question.imageDescription }),
          ...(question.options && question.options.length > 0 && { options: question.options }),
          ...(question.minValue !== undefined && { minValue: question.minValue }),
          ...(question.maxValue !== undefined && { maxValue: question.maxValue }),
          ...(question.unit && { unit: question.unit }),
          ...(question.nearRangePoints !== undefined && { nearRangePoints: question.nearRangePoints }),
          ...(question.nearRangeTolerance !== undefined && { nearRangeTolerance: question.nearRangeTolerance }),
          ...(question.eventSponsorId && { eventSponsorId: question.eventSponsorId }),
        };

        await createFantasyQuestion(firestore, questionData);
      }

      toast({
        title: 'Game Created!',
        description: `Successfully created game with ${questions.length} events.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create game.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[90vh] overflow-y-auto p-1">
      {/* Game Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Game Information</CardTitle>
          <CardDescription>Basic details about the fantasy game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Game Title *</Label>
            <Input
              id="title"
              value={gameForm.title}
              onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
              required
              placeholder="e.g., Gold Ornament Price Prediction"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={gameForm.description}
              onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
              required
              rows={3}
              placeholder="Describe the game..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={gameForm.category}
                onValueChange={(value) => setGameForm({ ...gameForm, category: value as FantasyCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-prediction">Price Prediction</SelectItem>
                  <SelectItem value="lifestyle-budget">Lifestyle & Budget</SelectItem>
                  <SelectItem value="fashion-trend">Fashion & Trend</SelectItem>
                  <SelectItem value="celebrity-style">Celebrity & Style</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryCoins">Entry Coins *</Label>
              <Input
                id="entryCoins"
                type="number"
                min="1"
                value={gameForm.entryCoins}
                onChange={(e) => setGameForm({ ...gameForm, entryCoins: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={gameForm.startTime}
                onChange={(e) => setGameForm({ ...gameForm, startTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Deadline) *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={gameForm.endTime}
                onChange={(e) => setGameForm({ ...gameForm, endTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultRevealTime">Result Reveal Time *</Label>
              <Input
                id="resultRevealTime"
                type="datetime-local"
                value={gameForm.resultRevealTime}
                onChange={(e) => setGameForm({ ...gameForm, resultRevealTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainSponsor">Main Sponsor (Overall Game Sponsor)</Label>
            <Select
              value={gameForm.mainSponsorId || 'none'}
              onValueChange={(value) => setGameForm({ ...gameForm, mainSponsorId: value === 'none' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select main sponsor (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Sponsor</SelectItem>
                {sponsors.map((sponsor) => (
                  <SelectItem key={sponsor.id} value={sponsor.id}>
                    {sponsor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions/Events Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Events/Questions ({questions.length}/18)</CardTitle>
              <CardDescription>
                Add 10-18 events/questions. Each can have its own sponsor and image.
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={handleAddQuestion}
              disabled={questions.length >= 18}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Event {question.order}</CardTitle>
                  {questions.length > 10 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => handleUpdateQuestion(index, { question: e.target.value })}
                    required
                    rows={2}
                    placeholder="e.g., Predict the weight of this gold chain ornament in grams"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prediction Type *</Label>
                    <Select
                      value={question.predictionType}
                      onValueChange={(value) => handleUpdateQuestion(index, { predictionType: value as PredictionType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up-down">Up/Down</SelectItem>
                        <SelectItem value="range">Range</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="image-weight">Image: Weight (grams)</SelectItem>
                        <SelectItem value="image-wastage">Image: Wastage %</SelectItem>
                        <SelectItem value="image-making-charges">Image: Making Charges %</SelectItem>
                        <SelectItem value="image-price">Image: Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Event Sponsor (Optional)</Label>
                    <Select
                      value={question.eventSponsorId || 'none'}
                      onValueChange={(value) => handleUpdateQuestion(index, { eventSponsorId: value === 'none' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event sponsor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Sponsor</SelectItem>
                        {sponsors.map((sponsor) => (
                          <SelectItem key={sponsor.id} value={sponsor.id}>
                            {sponsor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Image Upload for Image-based Questions */}
                {(question.predictionType.startsWith('image-')) && (
                  <div className="space-y-2">
                    <Label>Question Image *</Label>
                    {question.imageUrl ? (
                      <div className="relative">
                        <Image
                          src={question.imageUrl}
                          alt="Question image"
                          width={300}
                          height={200}
                          className="rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleUpdateQuestion(index, { imageUrl: undefined })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                          disabled={uploadingImage === `question-${index}`}
                          className="hidden"
                          id={`image-upload-${index}`}
                        />
                        <Label
                          htmlFor={`image-upload-${index}`}
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          {uploadingImage === `question-${index}` ? (
                            <Loader className="h-8 w-8 animate-spin text-primary mb-2" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {uploadingImage === `question-${index}` ? 'Uploading...' : 'Upload Image'}
                          </span>
                        </Label>
                      </div>
                    )}
                    <Input
                      placeholder="Image description (e.g., Gold Chain Ornament)"
                      value={question.imageDescription || ''}
                      onChange={(e) => handleUpdateQuestion(index, { imageDescription: e.target.value })}
                    />
                  </div>
                )}

                {/* Options for Multiple Choice */}
                {question.predictionType === 'multiple-choice' && (
                  <div className="space-y-2">
                    <Label>Options (one per line) *</Label>
                    <Textarea
                      value={question.options?.join('\n') || ''}
                      onChange={(e) => {
                        const options = e.target.value.split('\n').filter(o => o.trim());
                        handleUpdateQuestion(index, { options: options.length > 0 ? options : undefined });
                      }}
                      rows={4}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                    />
                  </div>
                )}

                {/* Range for Range/Image predictions */}
                {(question.predictionType === 'range' || question.predictionType.startsWith('image-')) && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Min Value</Label>
                      <Input
                        type="number"
                        value={question.minValue || ''}
                        onChange={(e) => handleUpdateQuestion(index, { minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Value</Label>
                      <Input
                        type="number"
                        value={question.maxValue || ''}
                        onChange={(e) => handleUpdateQuestion(index, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input
                        value={question.unit || ''}
                        onChange={(e) => handleUpdateQuestion(index, { unit: e.target.value || undefined })}
                        placeholder="₹, %, grams, kg"
                      />
                    </div>
                  </div>
                )}

                {/* Scoring */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Exact Match Points *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.exactMatchPoints}
                      onChange={(e) => handleUpdateQuestion(index, { exactMatchPoints: parseInt(e.target.value) || 100 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Near Range Points</Label>
                    <Input
                      type="number"
                      value={question.nearRangePoints || ''}
                      onChange={(e) => handleUpdateQuestion(index, { nearRangePoints: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tolerance %</Label>
                    <Input
                      type="number"
                      value={question.nearRangeTolerance || ''}
                      onChange={(e) => handleUpdateQuestion(index, { nearRangeTolerance: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || questions.length < 10}>
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Game'
          )}
        </Button>
      </div>
    </form>
  );
}

