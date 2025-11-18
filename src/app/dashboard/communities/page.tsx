import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { communities } from '@/lib/mock-data';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function CommunitiesPage() {
  return (
    <div>
      <PageHeader
        title="Find Your Circle"
        description="Join communities based on your interests, life-stage, or city."
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <Card key={community.id} className="flex flex-col">
            <CardHeader className="p-0">
              <div className="relative aspect-video w-full">
                <Image
                  src={community.image}
                  alt={community.name}
                  fill
                  className="rounded-t-lg object-cover"
                  data-ai-hint="community people"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <CardTitle className="mb-2 text-xl font-headline">
                {community.name}
              </CardTitle>
              <CardDescription>{community.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between p-4 pt-0">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1.5 h-4 w-4" />
                {community.memberCount.toLocaleString()} members
              </div>
              <Button asChild size="sm">
                <Link href={`/dashboard/communities/${community.id}`}>
                  View
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
