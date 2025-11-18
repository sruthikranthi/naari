import { HeartPulse } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function WellnessPage() {
  return (
    <div>
      <PageHeader
        title="Wellness Center"
        description="Your space for mental and physical well-being."
      />
      <Card className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HeartPulse className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-headline">Coming Soon!</h2>
          <p className="max-w-md text-muted-foreground">
            Our Wellness Center is under construction. Soon, you'll find mood trackers, meditation audio, self-care challenges, and much more to support your journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
