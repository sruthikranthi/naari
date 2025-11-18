import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { users } from '@/lib/mock-data';

export function CreatePost() {
  const user = users[0];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage
              src="https://picsum.photos/seed/user1/100/100"
              alt={user.name}
              data-ai-hint="woman portrait"
            />
            <AvatarFallback>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-2">
            <Textarea
              placeholder="What's on your mind, Sakhi?"
              className="border-none bg-secondary focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="anonymous-post" />
                <Label
                  htmlFor="anonymous-post"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Post Anonymously
                </Label>
              </div>
              <Button size="sm">Post</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
