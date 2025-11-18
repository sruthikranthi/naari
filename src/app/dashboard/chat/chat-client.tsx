'use client';
import { useState, useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertCircle,
  ArrowUp,
  Image as ImageIcon,
  Shield,
  Smile,
  MessageCircle,
  CheckCheck,
  Pin,
  MoreVertical,
  ThumbsUp,
  Heart,
  Laugh,
} from 'lucide-react';

import { checkMessageSafety } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { users } from '@/lib/mock-data';
import type { Message } from '@/lib/mock-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Analyzing...' : 'Check Safety'}
    </Button>
  );
}

export function ChatClient() {
  const { toast } = useToast();
  const [safeMode, setSafeMode] = useState(false);
  const [initialState, _] = useState({ message: '' });
  const [state, formAction] = useActionState(checkMessageSafety, initialState);
  const [activeChatId, setActiveChatId] = useState('u2');
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      senderId: 'u2',
      text: 'Hey! How are you doing?',
      timestamp: '10:00 AM',
    },
    {
      id: 'm2',
      senderId: 'u1',
      text: "I'm doing great, thanks for asking! Just working on some projects.",
      timestamp: '10:01 AM',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    if (activeChatId !== 'self') {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [activeChatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;

    if(safeMode){
        toast({
            variant: "destructive",
            title: "Safe Mode is On",
            description: "You cannot send messages while Safe Mode is active.",
        });
        return;
    }

    const newMessage: Message = {
      id: `m${messages.length + 1}`,
      senderId: 'u1', // Assuming current user is u1
      text: message,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages([...messages, newMessage]);
    setMessage('');
    
    // Simulate a reply
    setTimeout(() => {
      const replyMessage: Message = {
        id: `m${messages.length + 2}`,
        senderId: activeChatId,
        text: 'Sounds interesting!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1500);

  };

  const activeChatUser = users.find((u) => u.id === activeChatId);

  const safetyScoreColor = (score: number) => {
    if (score < 40) return 'bg-destructive text-destructive-foreground';
    if (score < 70) return 'bg-amber-500 text-white';
    return 'bg-green-600 text-white';
  };

  const selfUser = users[0];
  const chatListUsers = [
    { id: 'self', name: 'Notes to Self', avatar: selfUser.avatar },
    ...users.slice(1),
  ];

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {/* Conversation List */}
      <div className="hidden flex-col border-r bg-card md:flex">
        <div className="p-4">
          <h2 className="font-headline text-2xl font-bold">Chats</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {chatListUsers.map((user) => (
            <div
              key={user.id}
              className={`flex cursor-pointer items-center gap-3 p-3 ${
                user.id === activeChatId ? 'bg-muted' : 'hover:bg-muted'
              }`}
              onClick={() => setActiveChatId(user.id)}
            >
              <Avatar>
                <AvatarImage
                  src={
                    user.id === 'self'
                      ? `https://picsum.photos/seed/user1/100/100`
                      : `https://picsum.photos/seed/${user.id}/100/100`
                  }
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
                  {user.id === 'self'
                    ? 'My private notes...'
                    : 'Last message preview...'}
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
            {activeChatUser && (
              <>
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
                <div>
                  <p className="font-semibold">{activeChatUser.name}</p>
                  {isTyping && (
                    <p className="text-xs text-primary">typing...</p>
                  )}
                </div>
              </>
            )}
            {activeChatId === 'self' && (
              <>
                <Avatar>
                  <AvatarImage
                    src={`https://picsum.photos/seed/user1/100/100`}
                    alt="Notes to Self"
                    data-ai-hint="journal book"
                  />
                  <AvatarFallback>NS</AvatarFallback>
                </Avatar>
                <p className="font-semibold">Notes to Self</p>
              </>
            )}
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

        {/* Pinned Message */}
        <div className="border-b bg-secondary/30 p-2 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Pin className="h-3 w-3" />
            <span>Let's catch up on Friday at 5 PM!</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-background/50 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div
                  className={cn(
                    'group relative flex items-end gap-3',
                    msg.senderId === 'u1' && 'justify-end'
                  )}
                >
                  {msg.senderId !== 'u1' && activeChatUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://picsum.photos/seed/${activeChatUser.id}/100/100`}
                        alt={activeChatUser.name}
                        data-ai-hint="woman nature"
                      />
                      <AvatarFallback>AS</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-xs rounded-lg p-3 shadow-sm',
                      msg.senderId === 'u1'
                        ? 'rounded-br-none bg-primary text-primary-foreground'
                        : 'rounded-bl-none bg-card'
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  {msg.senderId === 'u1' && (
                     <Avatar className="h-8 w-8">
                        <AvatarImage
                        src="https://picsum.photos/seed/user1/100/100"
                        alt="My Avatar"
                        data-ai-hint="woman portrait"
                        />
                        <AvatarFallback>PS</AvatarFallback>
                    </Avatar>
                  )}

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn('absolute top-0 hidden group-hover:block', msg.senderId === 'u1' ? 'left-full ml-2' : 'right-full mr-2')}>
                        <Smile className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                      <MessageReactions />
                    </PopoverContent>
                  </Popover>
                </div>
                 <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", msg.senderId === 'u1' && 'justify-end')}>
                    <span>{msg.timestamp}</span>
                    {msg.senderId === 'u1' && <CheckCheck className="h-4 w-4 text-primary" />}
                </div>
              </div>
            ))}
             <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input and AI Tool */}
        <div className="border-t bg-card p-4">
          <Card>
            <form onSubmit={handleSendMessage}>
              <CardContent className="p-4">
                <div className="relative">
                  <Textarea
                    name="message"
                    placeholder="Type a message..."
                    className="pr-20"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey){
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
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
                  <span>AI-powered safety is active.</span>
                </div>
                <div className="flex gap-2">
                   <Button type="button" onClick={() => formAction(new FormData(document.querySelector('form')!))}>Check Safety</Button>
                  <Button type="submit" disabled={safeMode}>
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

function MessageReactions() {
  const reactions = [
    { icon: ThumbsUp, label: 'Like' },
    { icon: Heart, label: 'Love' },
    { icon: Laugh, label: 'Haha' },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-md">
      {reactions.map((r) => (
        <Button key={r.label} variant="ghost" size="icon" className="h-7 w-7">
          <r.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
