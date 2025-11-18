import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function LearningPage() {
  return (
    <div>
      <PageHeader
        title="Learning Zone"
        description="Empower yourself with new skills and knowledge."
      />
      <Card className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-headline">Coming Soon!</h2>
          <p className="max-w-md text-muted-foreground">
            We're busy curating a fantastic collection of courses and workshops just for you, covering makeup, business, freelancing, and more. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
