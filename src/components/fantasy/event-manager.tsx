/**
 * Event Manager Component
 * 
 * Allows admins to create, view, edit, and manage fantasy events
 */

'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { FantasyEvent, FantasyQuestion } from '@/lib/fantasy/types';
import { 
  getFantasyEventsByGame, 
  getActiveFantasyEvents,
  createFantasyEvent,
  updateFantasyEvent,
  deleteFantasyEvent,
  getFantasyQuestionsByGame,
} from '@/lib/fantasy/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAllFantasyGames } from '@/lib/fantasy/services';
import type { FantasyGame } from '@/lib/fantasy/types';
import { Timestamp } from 'firebase/firestore';

interface EventManagerProps {
  firestore: Firestore;
  user: { uid: string };
  toast: ReturnType<typeof useToast>['toast'];
}

export function EventManager({ firestore, user, toast }: EventManagerProps) {
  const [events, setEvents] = useState<FantasyEvent[]>([]);
  const [games, setGames] = useState<FantasyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FantasyEvent | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    loadGames();
  }, [firestore]);

  useEffect(() => {
    if (selectedGameId) {
      loadEvents();
    }
  }, [firestore, selectedGameId, showActiveOnly]);

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

  const loadEvents = async () => {
    if (!firestore) return;

    try {
      setLoading(true);
      let loadedEvents: FantasyEvent[];

      if (showActiveOnly) {
        loadedEvents = await getActiveFantasyEvents(
          firestore,
          selectedGameId === 'all' ? undefined : selectedGameId
        );
      } else if (selectedGameId === 'all') {
        // Get all events (would need a new service function)
        loadedEvents = [];
      } else {
        loadedEvents = await getFantasyEventsByGame(firestore, selectedGameId);
      }

      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteFantasyEvent(firestore, eventId);
      toast({
        title: 'Success',
        description: 'Event deleted successfully.',
      });
      loadEvents();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete event.',
      });
    }
  };

  const handleToggleActive = async (event: FantasyEvent) => {
    try {
      await updateFantasyEvent(firestore, event.id, {
        isActive: !event.isActive,
      });
      toast({
        title: 'Success',
        description: `Event ${event.isActive ? 'deactivated' : 'activated'}.`,
      });
      loadEvents();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update event.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Event Management</CardTitle>
          <CardDescription>
            Create and manage limited-time events with specific question sets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="activeOnly"
                checked={showActiveOnly}
                onCheckedChange={(checked) => setShowActiveOnly(checked === true)}
              />
              <Label htmlFor="activeOnly" className="cursor-pointer">
                Show active events only
              </Label>
            </div>

            <div className="flex items-end">
              <Button onClick={() => setShowCreateDialog(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No events found. Create your first event to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const game = games.find(g => g.id === event.gameId);
                  const startTime = event.startTime instanceof Timestamp
                    ? event.startTime.toDate()
                    : new Date(event.startTime as any);
                  const endTime = event.endTime instanceof Timestamp
                    ? event.endTime.toDate()
                    : new Date(event.endTime as any);
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{game?.title || event.gameId}</TableCell>
                      <TableCell>
                        {startTime.toLocaleDateString()} {startTime.toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {endTime.toLocaleDateString()} {endTime.toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.questionIds.length} questions</Badge>
                      </TableCell>
                      <TableCell>
                        {event.isActive ? (
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(event)}
                          >
                            {event.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEvent(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      {showCreateDialog && (
        <CreateEventDialog
          games={games}
          firestore={firestore}
          user={user}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadEvents();
          }}
          toast={toast}
        />
      )}

      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          games={games}
          firestore={firestore}
          user={user}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null);
            loadEvents();
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// Create Event Dialog
function CreateEventDialog({
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
  const [availableQuestions, setAvailableQuestions] = useState<FantasyQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gameId: '',
    description: '',
    startTime: '',
    endTime: '',
    isActive: true,
    selectedQuestionIds: [] as string[],
  });

  useEffect(() => {
    if (formData.gameId) {
      loadQuestions();
    }
  }, [formData.gameId]);

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const questions = await getFantasyQuestionsByGame(firestore, formData.gameId, {
        isActive: true,
      });
      setAvailableQuestions(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gameId || !formData.name || !formData.startTime || !formData.endTime) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    try {
      const eventData: Omit<FantasyEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        gameId: formData.gameId,
        description: formData.description,
        startTime: Timestamp.fromDate(new Date(formData.startTime)),
        endTime: Timestamp.fromDate(new Date(formData.endTime)),
        questionIds: formData.selectedQuestionIds,
        isActive: formData.isActive,
        createdBy: user.uid,
      };

      await createFantasyEvent(firestore, eventData);

      toast({
        title: 'Success',
        description: 'Event created successfully!',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create event.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedQuestionIds: prev.selectedQuestionIds.includes(questionId)
        ? prev.selectedQuestionIds.filter(id => id !== questionId)
        : [...prev.selectedQuestionIds, questionId],
    }));
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
            Create a limited-time event with specific questions. Events can override default game questions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Event Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Diwali Special"
              required
            />
          </div>

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
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Special event description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Time *</Label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.gameId && (
            <div>
              <Label>Select Questions ({formData.selectedQuestionIds.length} selected)</Label>
              {loadingQuestions ? (
                <div className="p-4 text-center text-muted-foreground">Loading questions...</div>
              ) : availableQuestions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No active questions available for this game.
                </div>
              ) : (
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {availableQuestions.map(question => (
                    <div key={question.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`q-${question.id}`}
                        checked={formData.selectedQuestionIds.includes(question.id)}
                        onCheckedChange={() => toggleQuestion(question.id)}
                      />
                      <Label
                        htmlFor={`q-${question.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {question.question}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (event is live)
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Event Dialog
function EditEventDialog({
  event,
  games,
  firestore,
  user,
  onClose,
  onSuccess,
  toast,
}: {
  event: FantasyEvent;
  games: FantasyGame[];
  firestore: Firestore;
  user: { uid: string };
  onClose: () => void;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [loading, setLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<FantasyQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const startTime = event.startTime instanceof Timestamp
    ? event.startTime.toDate()
    : new Date(event.startTime as any);
  const endTime = event.endTime instanceof Timestamp
    ? event.endTime.toDate()
    : new Date(event.endTime as any);

  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description || '',
    startTime: startTime.toISOString().slice(0, 16),
    endTime: endTime.toISOString().slice(0, 16),
    isActive: event.isActive,
    selectedQuestionIds: event.questionIds || [],
  });

  useEffect(() => {
    if (event.gameId) {
      loadQuestions();
    }
  }, [event.gameId]);

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const questions = await getFantasyQuestionsByGame(firestore, event.gameId, {
        isActive: true,
      });
      setAvailableQuestions(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateFantasyEvent(firestore, event.id, {
        name: formData.name,
        description: formData.description,
        startTime: Timestamp.fromDate(new Date(formData.startTime)),
        endTime: Timestamp.fromDate(new Date(formData.endTime)),
        questionIds: formData.selectedQuestionIds,
        isActive: formData.isActive,
      });

      toast({
        title: 'Success',
        description: 'Event updated successfully!',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update event.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedQuestionIds: prev.selectedQuestionIds.includes(questionId)
        ? prev.selectedQuestionIds.filter(id => id !== questionId)
        : [...prev.selectedQuestionIds, questionId],
    }));
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event details and question assignments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Event Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Time *</Label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Select Questions ({formData.selectedQuestionIds.length} selected)</Label>
            {loadingQuestions ? (
              <div className="p-4 text-center text-muted-foreground">Loading questions...</div>
            ) : availableQuestions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No active questions available for this game.
              </div>
            ) : (
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                {availableQuestions.map(question => (
                  <div key={question.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`q-${question.id}`}
                      checked={formData.selectedQuestionIds.includes(question.id)}
                      onCheckedChange={() => toggleQuestion(question.id)}
                    />
                    <Label
                      htmlFor={`q-${question.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {question.question}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (event is live)
            </Label>
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

