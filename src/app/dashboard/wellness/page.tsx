'use client';
import { useState, useActionState, useRef, useEffect } from 'react';
import { getAudio, getCustomMeditationAudio } from '@/app/actions';
import {
  HeartPulse,
  Brain,
  Wind,
  Smile,
  Meh,
  Frown,
  Angry,
  Sparkles,
  BookOpen,
  Coffee,
  Moon,
  Leaf,
  Droplets,
  PenSquare,
  BarChart,
  Play,
  Pause,
  Loader,
  Check,
  Wand,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { selfCareActivities } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const moods = [
  { icon: Sparkles, label: 'Great' },
  { icon: Smile, label: 'Good' },
  { icon: Meh, label: 'Okay' },
  { icon: Frown, label: 'Bad' },
  { icon: Angry, label: 'Awful' },
];

const lucideIcons: { [key: string]: React.ElementType } = {
  Wind,
  Coffee,
  Moon,
  Leaf,
};

const guidedMeditations = [
  {
    id: 'med1',
    title: 'Stress Relief',
    duration: '10 min',
    script:
      'Welcome to this guided meditation for stress relief. Find a comfortable position, either sitting or lying down. Close your eyes gently. Bring your awareness to your breath. Notice the sensation of the air entering your body, and the feeling of release as you exhale. Let go of any tension with each breath out. You are calm, you are relaxed.',
    language: 'en-US',
  },
  {
    id: 'med2',
    title: 'Focus & Concentration',
    duration: '5 min',
    script:
      'This is a short meditation to improve focus. Sit upright and close your eyes. Imagine a single point of light in front of you. Hold your attention on this light. If your mind wanders, gently guide it back. This practice sharpens your concentration. Feel your mind becoming clear and focused.',
    language: 'en-US',
  },
  {
    id: 'med3',
    title: 'Gratitude Practice',
    duration: '15 min',
    script:
      'Begin this gratitude practice by closing your eyes. Bring to mind three things you are grateful for today. They can be small or large. A warm cup of tea, a kind word from a friend, the roof over your head. Feel the warmth of gratitude fill your heart. Carry this feeling with you throughout your day.',
    language: 'en-US',
  },
];

export default function WellnessPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [playingMeditationId, setPlayingMeditationId] = useState<
    string | null
  >(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const customAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const [audioState, getAudioAction, isTtsPending] = useActionState(getAudio, {
    result: undefined,
    error: undefined,
  });

  const [customMeditationState, getCustomMeditationAction, isCustomPending] =
    useActionState(getCustomMeditationAudio, {
      result: undefined,
      error: undefined,
      prompt: undefined,
    });

  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  
  const [isPlayingCustom, setIsPlayingCustom] = useState(false);

  const handleCompleteActivity = (activityTitle: string) => {
    if (completedActivities.includes(activityTitle)) {
      setCompletedActivities(
        completedActivities.filter((t) => t !== activityTitle)
      );
    } else {
      setCompletedActivities([...completedActivities, activityTitle]);
      toast({
        title: 'Activity Completed!',
        description: `You've completed "${activityTitle}". Keep it up!`,
      });
    }
  };

  useEffect(() => {
    if (audioState.result?.media && playingMeditationId) {
      if (audioRef.current) {
        audioRef.current.src = audioState.result.media;
        audioRef.current.play();
      }
    }
    if (audioState.error) {
      toast({
        variant: 'destructive',
        title: 'Error generating audio',
        description: audioState.error,
      });
      setPlayingMeditationId(null);
    }
  }, [audioState, toast, playingMeditationId]);
  
  useEffect(() => {
    if (customMeditationState.result?.media) {
      if (customAudioRef.current) {
        customAudioRef.current.src = customMeditationState.result.media;
        customAudioRef.current.play();
        setIsPlayingCustom(true);
      }
    }
    if (customMeditationState.error) {
      toast({
        variant: 'destructive',
        title: 'Error generating custom meditation',
        description: customMeditationState.error,
      });
    }
  }, [customMeditationState, toast]);

  const handlePlay = (meditationId: string) => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setPlayingMeditationId(meditationId);
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingMeditationId(null);
  };

  const handleAudioEnded = () => {
    setPlayingMeditationId(null);
  };
  
  const handleCustomAudioEnded = () => {
    setIsPlayingCustom(false);
  };
  
  const handlePlayPauseCustom = () => {
    if(customAudioRef.current) {
        if(isPlayingCustom){
            customAudioRef.current.pause();
            setIsPlayingCustom(false);
        } else {
            customAudioRef.current.play();
            setIsPlayingCustom(true);
        }
    }
  }

  const handleMoodSelect = (moodLabel: string) => {
    setSelectedMood(moodLabel);
    toast({
      title: 'Mood Logged',
      description: `You're feeling ${moodLabel.toLowerCase()} today.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Wellness Center"
        description="Your space for mental and physical well-being."
      />

      <Card>
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-4 sm:justify-start">
          {moods.map((mood) => (
            <Button
              key={mood.label}
              variant={selectedMood === mood.label ? 'default' : 'outline'}
              className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-lg"
              onClick={() => handleMoodSelect(mood.label)}
            >
              <mood.icon
                className={cn(
                  'h-8 w-8',
                  selectedMood === mood.label
                    ? 'text-primary-foreground'
                    : 'text-primary'
                )}
              />
              <span className="text-sm">{mood.label}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand className="text-primary" />
            Personalized Session
          </CardTitle>
          <CardDescription>
            Tell us what you need, and we'll generate a unique meditation just
            for you, in your preferred language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={getCustomMeditationAction} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="meditation-prompt">I want a meditation to...</Label>
                <Input
                  id="meditation-prompt"
                  name="prompt"
                  placeholder="e.g., help me relax after a long day"
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select name="language" defaultValue="en-US">
                    <SelectTrigger id="language">
                        <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en-US">English</SelectItem>
                        <SelectItem value="hi-IN">Hindi</SelectItem>
                        <SelectItem value="ta-IN">Tamil</SelectItem>
                        <SelectItem value="te-IN">Telugu</SelectItem>
                        <SelectItem value="kn-IN">Kannada</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
             {customMeditationState.error && (
              <p className="mt-1 text-xs text-destructive">
                {customMeditationState.error}
              </p>
            )}
            <Button type="submit" disabled={isCustomPending}>
              {isCustomPending ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate My Meditation
            </Button>
          </form>
          {customMeditationState.result && (
             <div className="mt-6 rounded-lg border bg-secondary/50 p-4">
                <p className="text-sm font-medium text-muted-foreground">Your custom session for: "{customMeditationState.prompt}"</p>
                <div className="mt-2 flex items-center gap-4">
                     <Button onClick={handlePlayPauseCustom} size="icon" disabled={!customMeditationState.result.media}>
                        {isPlayingCustom ? <Pause /> : <Play />}
                     </Button>
                     <p className="font-semibold">{isPlayingCustom ? 'Playing...' : 'Ready to play'}</p>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <h2 className="font-headline text-2xl font-bold">
            Daily Self-Care
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {selfCareActivities.map((activity) => {
              const Icon = lucideIcons[activity.icon];
              const isCompleted = completedActivities.includes(activity.title);
              return (
                <Card key={activity.title} className="flex flex-col">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {activity.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto flex justify-end">
                    <Button
                      variant={isCompleted ? 'secondary' : 'default'}
                      onClick={() => handleCompleteActivity(activity.title)}
                    >
                      {isCompleted ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : null}
                      {isCompleted ? 'Completed' : 'Mark as Done'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <h2 className="font-headline text-2xl font-bold pt-4">
            Guided Meditations
          </h2>
          <div className="space-y-4">
            {guidedMeditations.map((meditation) => (
              <Card key={meditation.id} className="flex items-center p-4">
                <div className="flex-1">
                  <p className="font-semibold">{meditation.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {meditation.duration}
                  </p>
                </div>
                {playingMeditationId === meditation.id ? (
                  isTtsPending ? (
                    <Button size="icon" variant="ghost" disabled>
                      <Loader className="h-5 w-5 animate-spin" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handlePause}
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                  )
                ) : (
                  <form
                    action={getAudioAction}
                    onSubmit={() => handlePlay(meditation.id)}
                  >
                    <input
                      type="hidden"
                      name="text"
                      value={meditation.script}
                    />
                     <input
                      type="hidden"
                      name="language"
                      value={meditation.language}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      disabled={isTtsPending}
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                  </form>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-bold">Quick Tools</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <PeriodTracker />
                <GratitudeJournal />
                <SleepDiary />
                <TherapyNotes />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Find Support</CardTitle>
              <Button asChild>
                <Link href="/dashboard/support-directory">View Directory</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect with verified mental health professionals and
                counselors for confidential support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      <audio ref={customAudioRef} onEnded={handleCustomAudioEnded} className="hidden" />
    </div>
  );
}


// #region Quick Tools Components

type JournalEntry = {
    id: number;
    text: string;
    date: string;
}

function GratitudeJournal() {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [newEntry, setNewEntry] = useState('');

    const handleSaveEntry = () => {
        if(newEntry.trim()){
            const entry: JournalEntry = {
                id: Date.now(),
                text: newEntry,
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            };
            setEntries([entry, ...entries]);
            setNewEntry('');
            toast({
                title: 'Entry Saved!',
                description: 'Your gratitude has been recorded.',
            });
        }
    }
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                 <Button
                    variant="outline"
                    className="flex h-24 flex-col items-center justify-center gap-2"
                  >
                    <PenSquare className="h-6 w-6 text-primary" />
                    <span className="text-center text-xs">Gratitude Journal</span>
                  </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Gratitude Journal</DialogTitle>
                    <DialogDescription>
                        Take a moment to write down what you're grateful for today.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea 
                        placeholder="Today, I am grateful for..."
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        rows={4}
                    />
                     <Button onClick={handleSaveEntry}>Save Entry</Button>
                </div>
                <div className="max-h-64 space-y-4 overflow-y-auto pr-2">
                    <h3 className="font-semibold">Your Entries</h3>
                     {entries.length > 0 ? (
                        entries.map(entry => (
                            <div key={entry.id} className="rounded-md border bg-secondary/50 p-3">
                                <p className="text-sm">{entry.text}</p>
                                <p className="text-xs text-muted-foreground mt-2">{entry.date}</p>
                            </div>
                        ))
                     ) : (
                        <p className="text-center text-sm text-muted-foreground">You have no entries yet.</p>
                     )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PeriodTracker() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 4),
  });
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex h-24 flex-col items-center justify-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <span className="text-center text-xs">Period Tracker</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Period Tracker</DialogTitle>
          <DialogDescription>Select the start and end dates of your cycle.</DialogDescription>
        </DialogHeader>
        <Calendar
          mode="range"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        <DialogFooter>
            <DialogClose asChild><Button>Save Dates</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type SleepEntry = { id: number; date: string; rating: number; notes: string };

function SleepDiary() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [entries, setEntries] = useState<SleepEntry[]>([]);
    const [rating, setRating] = useState(3);
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    const handleSave = () => {
        const newEntry: SleepEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            rating,
            notes
        };
        setEntries([newEntry, ...entries]);
        setRating(3);
        setNotes('');
        toast({ title: 'Sleep Logged!', description: "Sweet dreams!" });
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex h-24 flex-col items-center justify-center gap-2">
                    <BarChart className="h-6 w-6 text-primary" />
                    <span className="text-center text-xs">Sleep Diary</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sleep Diary</DialogTitle>
                    <DialogDescription>How did you sleep last night?</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label>Sleep Quality</Label>
                        <div className="flex justify-between mt-2">
                            {[1, 2, 3, 4, 5].map(r => (
                                <Button key={r} variant={rating === r ? 'default' : 'outline'} size="icon" onClick={() => setRating(r)}>{r}</Button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label>Notes (optional)</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Woke up a few times..." />
                    </div>
                </div>
                <DialogFooter>
                     <Button onClick={handleSave}>Log Sleep</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function TherapyNotes() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [notes, setNotes] = useState('');

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex h-24 flex-col items-center justify-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    <span className="text-center text-xs">Therapy Notes</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Therapy Notes</DialogTitle>
                    <DialogDescription>A secure place for your thoughts. These notes are private to you.</DialogDescription>
                </DialogHeader>
                <Textarea 
                    rows={10} 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Write down your reflections, thoughts, or things to discuss..."
                />
                <DialogFooter>
                     <DialogClose asChild><Button>Done</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// #endregion
