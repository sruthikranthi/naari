'use client';
import { useState, useActionState, useRef, useEffect } from 'react';
import { getAudio } from '@/app/actions';
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
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const moods = [
  { icon: Sparkles, label: 'Great' },
  { icon: Smile, label: 'Good' },
  { icon: Meh, label: 'Okay' },
  { icon: Frown, label: 'Bad' },
  { icon: Angry, label: 'Awful' },
];

const selfCareActivities = [
  {
    icon: Wind,
    title: 'Mindful Morning',
    description: 'Start your day with 5 minutes of mindful breathing.',
  },
  {
    icon: Coffee,
    title: 'Mindful Break',
    description: 'Take a 10-minute break away from your screens.',
  },
  {
    icon: Moon,
    title: 'Digital Detox',
    description: 'No screens for 1 hour before bed for better sleep.',
  },
  {
    icon: Leaf,
    title: 'Connect with Nature',
    description: 'Spend 15 minutes outdoors, observing your surroundings.',
  },
];

const guidedMeditations = [
  {
    id: 'med1',
    title: 'Stress Relief',
    duration: '10 min',
    script:
      'Welcome to this guided meditation for stress relief. Find a comfortable position, either sitting or lying down. Close your eyes gently. Bring your awareness to your breath. Notice the sensation of the air entering your body, and the feeling of release as you exhale. Let go of any tension with each breath out. You are calm, you are relaxed.',
  },
  {
    id: 'med2',
    title: 'Focus & Concentration',
    duration: '5 min',
    script:
      'This is a short meditation to improve focus. Sit upright and close your eyes. Imagine a single point of light in front of you. Hold your attention on this light. If your mind wanders, gently guide it back. This practice sharpens your concentration. Feel your mind becoming clear and focused.',
  },
  {
    id: 'med3',
    title: 'Gratitude Practice',
    duration: '15 min',
    script:
      'Begin this gratitude practice by closing your eyes. Bring to mind three things you are grateful for today. They can be small or large. A warm cup of tea, a kind word from a friend, the roof over your head. Feel the warmth of gratitude fill your heart. Carry this feeling with you throughout your day.',
  },
];

const quickTools = [
  { icon: Droplets, label: 'Period Tracker' },
  { icon: PenSquare, label: 'Gratitude Journal' },
  { icon: BarChart, label: 'Sleep Diary' },
  { icon: Brain, label: 'Therapy Notes' },
];

export default function WellnessPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [playingMeditationId, setPlayingMeditationId] = useState<
    string | null
  >(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const [audioState, getAudioAction, isPending] = useActionState(getAudio, {
    result: undefined,
    error: undefined,
  });

  useEffect(() => {
    if (audioState.result?.media) {
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
  }, [audioState, toast]);

  const handlePlayPause = (meditationId: string, script: string) => {
    if (playingMeditationId === meditationId) {
      // Pause the current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingMeditationId(null);
    } else {
      // If other audio is playing, stop it
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }

      setPlayingMeditationId(meditationId);
      const formData = new FormData();
      formData.append('text', script);
      getAudioAction(formData);
    }
  };

  const handleAudioEnded = () => {
    setPlayingMeditationId(null);
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
              onClick={() => setSelectedMood(mood.label)}
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-bold">
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
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    handlePlayPause(meditation.id, meditation.script)
                  }
                  disabled={isPending && playingMeditationId === meditation.id}
                >
                  {isPending && playingMeditationId === meditation.id ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : playingMeditationId === meditation.id ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-2xl font-bold">Quick Tools</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {quickTools.map((tool) => (
                  <Button
                    key={tool.label}
                    variant="outline"
                    className="flex h-24 flex-col items-center justify-center gap-2"
                  >
                    <tool.icon className="h-6 w-6 text-primary" />
                    <span className="text-center text-xs">{tool.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Find Support</CardTitle>
              <Button>View Directory</Button>
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
    </div>
  );
}
