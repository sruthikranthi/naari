/**
 * Question Pool Manager Component
 * 
 * Allows admins to view, filter, create, edit, and manage questions from the pool
 */

'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { FantasyQuestion, QuestionDifficulty, QuestionSource, FantasyGameType, PredictionType } from '@/lib/fantasy/types';
import { getFantasyQuestionsByGame, updateFantasyQuestion, deleteFantasyQuestion, createFantasyQuestion } from '@/lib/fantasy/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Plus, Filter, CheckCircle, XCircle, Eye } from 'lucide-react';
import { getAllFantasyGames } from '@/lib/fantasy/services';
import type { FantasyGame } from '@/lib/fantasy/types';

interface QuestionPoolManagerProps {
  firestore: Firestore;
  user: { uid: string };
  toast: ReturnType<typeof useToast>['toast'];
}

export function QuestionPoolManager({ firestore, user, toast }: QuestionPoolManagerProps) {
  const [questions, setQuestions] = useState<FantasyQuestion[]>([]);
  const [games, setGames] = useState<FantasyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<FantasyQuestion | null>(null);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [selectedGameForCreate, setSelectedGameForCreate] = useState<string>('');

  useEffect(() => {
    loadGames();
  }, [firestore]);

  useEffect(() => {
    if (selectedGameId) {
      loadQuestions();
    }
  }, [firestore, selectedGameId]);

  const loadGames = async () => {
    try {
      const allGames = await getAllFantasyGames(firestore);
      setGames(allGames);
      if (allGames.length > 0 && selectedGameId === 'all') {
        setSelectedGameId(allGames[0].id);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load games.',
      });
    }
  };

  const loadQuestions = async () => {
    if (!firestore || selectedGameId === 'all') {
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allQuestions = await getFantasyQuestionsByGame(firestore, selectedGameId);
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load questions.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (question: FantasyQuestion) => {
    try {
      await updateFantasyQuestion(firestore, question.id, {
        isActive: !question.isActive,
      });
      toast({
        title: 'Success',
        description: `Question ${question.isActive ? 'deactivated' : 'activated'}.`,
      });
      loadQuestions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update question.',
      });
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteFantasyQuestion(firestore, questionId);
      toast({
        title: 'Success',
        description: 'Question deleted successfully.',
      });
      loadQuestions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete question.',
      });
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) {
      return false;
    }
    if (filterSource !== 'all' && q.source !== filterSource) {
      return false;
    }
    if (filterActive !== 'all') {
      if (filterActive === 'active' && !q.isActive) return false;
      if (filterActive === 'inactive' && q.isActive) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Question Pool</CardTitle>
          <CardDescription>
            View and manage questions from the pool. Questions can be reused across multiple games.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Game</Label>
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {games.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source</Label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="trend">Trend</SelectItem>
                  <SelectItem value="celebrity">Celebrity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setCreatingQuestion(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Question
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No questions found. {selectedGameId === 'all' ? 'Select a game to view questions.' : 'Try adjusting filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={question.question}>
                        {question.question}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{question.predictionType}</Badge>
                    </TableCell>
                    <TableCell>
                      {question.difficulty && (
                        <Badge variant="secondary">{question.difficulty}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{question.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {question.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {question.tags && question.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{question.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {question.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{question.exactMatchPoints}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(question)}
                        >
                          {question.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <EditQuestionDialog
          question={editingQuestion}
          firestore={firestore}
          user={user}
          onClose={() => setEditingQuestion(null)}
          onSuccess={() => {
            setEditingQuestion(null);
            loadQuestions();
          }}
          toast={toast}
        />
      )}

      {/* Create Question Dialog */}
      {creatingQuestion && (
        <CreateQuestionDialog
          games={games}
          firestore={firestore}
          user={user}
          onClose={() => {
            setCreatingQuestion(false);
            setSelectedGameForCreate('');
          }}
          onSuccess={() => {
            setCreatingQuestion(false);
            setSelectedGameForCreate('');
            loadQuestions();
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// Edit Question Dialog
function EditQuestionDialog({
  question,
  firestore,
  user,
  onClose,
  onSuccess,
  toast,
}: {
  question: FantasyQuestion;
  firestore: Firestore;
  user: { uid: string };
  onClose: () => void;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: question.question,
    difficulty: question.difficulty || 'medium',
    tags: question.tags?.join(', ') || '',
    isActive: question.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await updateFantasyQuestion(firestore, question.id, {
        question: formData.question,
        difficulty: formData.difficulty as QuestionDifficulty,
        tags: tagsArray,
        isActive: formData.isActive,
      });

      toast({
        title: 'Success',
        description: 'Question updated successfully!',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update question.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Update question details. Note: Changing prediction type or options requires recreation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Question Text</Label>
            <Textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData({ ...formData, difficulty: v as QuestionDifficulty })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(v) => setFormData({ ...formData, isActive: v === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="daily, seasonal, wedding, festival"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate tags with commas (e.g., daily, seasonal, wedding)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Question Dialog
function CreateQuestionDialog({
  games,
  firestore,
  user,
  onClose,
  onSuccess,
  toast,
}: {
  games: FantasyGame[];
  firestore: Firestore;
  user: { uid: string };
  onClose: () => void;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gameId: '',
    question: '',
    predictionType: 'up-down' as PredictionType,
    difficulty: 'medium' as QuestionDifficulty,
    tags: '',
    exactMatchPoints: 100,
    options: '',
    minValue: '',
    maxValue: '',
    unit: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gameId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a game.',
      });
      return;
    }

    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const questionData: Omit<FantasyQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
        gameId: formData.gameId,
        question: formData.question,
        predictionType: formData.predictionType,
        exactMatchPoints: formData.exactMatchPoints,
        difficulty: formData.difficulty as QuestionDifficulty,
        tags: tagsArray,
        source: 'admin',
        isActive: true,
        createdBy: user.uid,
        ...(formData.options && {
          options: formData.options.split(',').map(o => o.trim()).filter(o => o.length > 0),
        }),
        ...(formData.minValue && { minValue: parseFloat(formData.minValue) }),
        ...(formData.maxValue && { maxValue: parseFloat(formData.maxValue) }),
        ...(formData.unit && { unit: formData.unit }),
      };

      await createFantasyQuestion(firestore, questionData);

      toast({
        title: 'Success',
        description: 'Question created successfully!',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create question.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Add a new question to the question pool. It can be reused across games.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Game *</Label>
            <Select value={formData.gameId} onValueChange={(v) => setFormData({ ...formData, gameId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent>
                {games.map(game => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Question Text *</Label>
            <Textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              rows={3}
              placeholder="What will be the market price of..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prediction Type *</Label>
              <Select
                value={formData.predictionType}
                onValueChange={(v) => setFormData({ ...formData, predictionType: v as PredictionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up-down">Up/Down</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData({ ...formData, difficulty: v as QuestionDifficulty })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.predictionType === 'multiple-choice' && (
            <div>
              <Label>Options (comma-separated) *</Label>
              <Input
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                placeholder="Option 1, Option 2, Option 3"
                required
              />
            </div>
          )}

          {(formData.predictionType === 'range') && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={formData.minValue}
                  onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={formData.maxValue}
                  onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="₹"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Points *</Label>
              <Input
                type="number"
                value={formData.exactMatchPoints}
                onChange={(e) => setFormData({ ...formData, exactMatchPoints: parseInt(e.target.value) || 100 })}
                required
              />
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="daily, seasonal, wedding"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Question'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

