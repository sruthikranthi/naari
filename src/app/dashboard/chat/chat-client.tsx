'use client';
import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertCircle,
  ArrowUp,
  Image as ImageIcon,
  Shield,
  Smile,
} from 'lucide-react';

import { checkMessageSafety } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { users } from '@/lib/mock-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Analyzing...' : 'Check Safety'}
    </Button>
  );
}

export function ChatClient() {
  const [safeMode, setSafeMode] = useState(false);
  const [initialState, _] = useState({ message: '' });
  const [state, formAction] = useActionState(checkMessageSafety, initialState);

  const activeChatUser = users[1];

  const safetyScoreColor = (score: number) => {
    if (score < 40) return 'bg-destructive text-destructive-foreground';
    if (score < 70) return 'bg-amber-500 text-white';
    return 'bg-green-600 text-white';
  };

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {/* Conversation List */}
      <div className="hidden flex-col border-r bg-card md:flex">
        <div className="p-4">
          <h2 className="text-2xl font-bold font-headline">Chats</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex cursor-pointer items-center gap-3 p-3 ${
                user.id === activeChatUser.id ? 'bg-muted' : 'hover:bg-muted'
              }`}
            >
              <Avatar>
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
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  Last message preview...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col md:col-span-2 lg:col-span-3">
        <header className="flex items-center justify-between border-b bg-card p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={`https://picsum.photos/seed/${activeChatUser.id}/100/100`}
                alt={activeChatUser.name}
                data-ai-hint="woman nature"
              />
              <AvatarFallback>
                {activeChatUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold">{activeChatUser.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="safe-mode"
              checked={safeMode}
              onCheckedChange={setSafeMode}
            />
            <Label htmlFor="safe-mode" className="text-sm">
              Safe Mode
            </Label>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-background/50 p-6">
          <div className="space-y-4">
            {/* Example messages */}
            <div className="flex items-end gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://picsum.photos/seed/${activeChatUser.id}/100/100`}
                  alt={activeChatUser.name}
                  data-ai-hint="woman nature"
                />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div className="max-w-xs rounded-lg bg-card p-3 shadow-sm">
                <p className="text-sm">Hey! How are you doing?</p>
              </div>
            </div>
            <div className="flex items-end justify-end gap-3">
              <div className="max-w-xs rounded-lg bg-primary p-3 text-primary-foreground shadow-sm">
                <p className="text-sm">
                  I'm doing great, thanks for asking! Just working on some
                  projects.
                </p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://picsum.photos/seed/user1/100/100"
                  alt="My Avatar"
                  data-ai-hint="woman portrait"
                />
                <AvatarFallback>PS</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Message Input and AI Tool */}
        <div className="border-t bg-card p-4">
          <Card>
            <form action={formAction}>
              <CardContent className="p-4">
                <div className="relative">
                  <Textarea
                    name="message"
                    placeholder="Type a message..."
                    className="pr-20"
                    rows={2}
                  />
                  <div className="absolute top-1/2 right-3 flex -translate-y-1/2 gap-1">
                    <Button variant="ghost" size="icon" disabled={safeMode}>
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Smile className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Your chat is secure.</span>
                </div>
                <div className="flex gap-2">
                  <SubmitButton />
                  <Button type="button">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </form>
            {state.error && (
              <p className="px-4 pb-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            {state.result && (
              <div className="space-y-2 p-4 pt-0">
                <h4 className="font-semibold">AI Safety Analysis</h4>
                <div className="flex items-start gap-4 rounded-lg border bg-secondary/50 p-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${safetyScoreColor(
                        state.result.safetyScore
                      )}`}
                    >
                      {state.result.safetyScore}
                    </div>
                    <span className="text-xs font-medium">Safety Score</span>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-sm text-muted-foreground italic">
                      For message: "{state.message}"
                    </p>
                    <p className="font-medium">Suggested Actions:</p>
                    <ul className="list-disc pl-5 text-sm">
                      {state.result.suggestedActions.length > 0 ? (
                        state.result.suggestedActions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))
                      ) : (
                        <li>Looks good!</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
