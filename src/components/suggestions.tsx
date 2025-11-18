import Link from 'next/link';
import { users, communities } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus } from 'lucide-react';

export function Suggestions() {
  const suggestedUsers = users.slice(2, 5);
  const suggestedCommunities = communities.slice(0, 2);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">People to Connect With</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`https://picsum.photos/seed/${user.id}/100/100`}
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
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Suggested for you
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="px-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Communities to Join</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedCommunities.map((community) => (
            <div key={community.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-md">
                        <img src={community.image} alt={community.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <p className="font-semibold">{community.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {community.memberCount.toLocaleString()} members
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm">
                    Join
                </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
