
'use client';
import { useState, useActionState, useEffect, useRef, useMemo } from 'react';
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
  Loader,
} from 'lucide-react';

import { checkMessageSafety, type AIPoweredChatSafetyOutput } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { User, Chat, Message as MessageType } from '@/lib/mock-data';
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
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

type SafetyCheckState = {
  result?: AIPoweredChatSafetyOutput;
  error?: string;
  message: string;
};

// Represents a chat with the other participant's data resolved
type ChatWithParticipant = Chat & {
    participant: User;
    lastMessage?: MessageType;
}

export function ChatClient() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [safeMode, setSafeMode] = useState(false);
  const [initialState, _] = useState<SafetyCheckState>({ message: '' });
  const [state, formAction, isSafetyCheckPending] = useActionState(checkMessageSafety, initialState);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Fetch chats the current user is part of
  const chatsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, 'chats'), where('participants', 'array-contains', user.uid)) : null,
    [firestore, user]
  );
  const { data: userChats, isLoading: areChatsLoading } = useCollection<Chat>(chatsQuery);

  // Fetch all users to find participants' details
  const usersQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users') : null),
    [firestore, user]
  );
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  // Fetch messages for the active chat
  const messagesQuery = useMemoFirebase(
    () => (firestore && activeChatId) ? query(collection(firestore, 'chats', activeChatId, 'messages'), orderBy('timestamp', 'asc')) : null,
    [firestore, activeChatId]
  );
  const { data: messages, isLoading: areMessagesLoading } = useCollection<MessageType>(messagesQuery);
  
  const chatList = useMemo<ChatWithParticipant[]>(() => {
    if (!userChats || !allUsers || !user) return [];
    return userChats
      .map(chat => {
        const otherParticipantId = chat.participants.find(p => p !== user.uid);
        const participant = allUsers.find(u => u.id === otherParticipantId);
        return participant ? { ...chat, participant } : null;
      })
      .filter((chat): chat is ChatWithParticipant => chat !== null);
  }, [userChats, allUsers, user]);


  const isSendDisabled = isSafetyCheckPending || safeMode || !message.trim();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendDisabled) return;

    if(safeMode){
        toast({
            variant: "destructive",
            title: "Safe Mode is On",
            description: "You cannot send messages while Safe Mode is active.",
        });
        return;
    }
    
    if (formRef.current) {
        const formData = new FormData(formRef.current);
        formAction(formData);
    }
  };

  useEffect(() => {
    // This effect runs after the safety check is complete
    if (!isSafetyCheckPending && state.result && state.message && activeChatId && user && firestore) {
        if (state.result.safetyScore >= 40) {
            const messagesCol = collection(firestore, 'chats', activeChatId, 'messages');
            const messageData = {
                senderId: user.uid,
                text: state.message,
                timestamp: serverTimestamp(),
                chatId: activeChatId,
            };
            
            addDoc(messagesCol, messageData).catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: messagesCol.path,
                    operation: 'create',
                    requestResourceData: messageData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });

            setMessage('');
        } else {
             toast({
                variant: "destructive",
                title: "Message Not Sent",
                description: "This message was blocked by the safety filter.",
            });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isSafetyCheckPending, activeChatId, toast, user, firestore]);

  const activeChat = chatList.find(c => c.id === activeChatId);

  const safetyScoreColor = (score: number) => {
    if (score < 40) return 'bg-destructive text-destructive-foreground';
    if (score < 70) return 'bg-amber-500 text-white';
    return 'bg-green-600 text-white';
  };

  if (isUserLoading || areChatsLoading || areUsersLoading) {
    return (
      <div className="flex h-full min-h-[calc(100vh-10rem)] w-full items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {/* Conversation List */}
      <div className="hidden flex-col border-r bg-card md:flex">
        <div className="p-4">
          <h2 className="font-headline text-2xl font-bold">Chats</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {chatList.map((chat) => (
            <div
              key={chat.id}
              className={`flex cursor-pointer items-center gap-3 p-3 ${
                chat.id === activeChatId ? 'bg-muted' : 'hover:bg-muted'
              }`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <Avatar>
                <AvatarImage
                  src={`https://picsum.photos/seed/${chat.participant.id}/100/100`}
                  alt={chat.participant.name}
                  data-ai-hint="woman portrait"
                />
                <AvatarFallback>
                  {chat.participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-semibold">{chat.participant.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  Last message...
                </p>
              </div>
            </div>
          ))}
          {chatList.length === 0 && <p className="p-4 text-center text-muted-foreground">No chats yet.</p>}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col md:col-span-2 lg:col-span-3">
        {activeChat ? (
          <>
          <header className="flex items-center justify-between border-b bg-card p-4">
            <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={`https://picsum.photos/seed/${activeChat.participant.id}/100/100`}
                    alt={activeChat.participant.name}
                    data-ai-hint="woman nature"
                  />
                  <AvatarFallback>
                    {activeChat.participant.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{activeChat.participant.name}</p>
                </div>
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

          <div className="flex-1 overflow-y-auto bg-background/50 p-6">
            <div className="space-y-4">
              {areMessagesLoading && <Loader className="mx-auto my-12 h-6 w-6 animate-spin text-primary" />}
              {messages && messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div
                    className={cn(
                      'group relative flex items-end gap-3',
                      msg.senderId === user?.uid && 'justify-end'
                    )}
                  >
                    {msg.senderId !== user?.uid && activeChat && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://picsum.photos/seed/${activeChat.participant.id}/100/100`}
                          alt={activeChat.participant.name}
                          data-ai-hint="woman nature"
                        />
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-xs rounded-lg p-3 shadow-sm',
                        msg.senderId === user?.uid
                          ? 'rounded-br-none bg-primary text-primary-foreground'
                          : 'rounded-bl-none bg-card'
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    {msg.senderId === user?.uid && user && (
                      <Avatar className="h-8 w-8">
                          <AvatarImage
                          src={`https://picsum.photos/seed/${user.uid}/100/100`}
                          alt="My Avatar"
                          data-ai-hint="woman portrait"
                          />
                          <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                    )}

                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn('absolute top-0 hidden group-hover:block', msg.senderId === user?.uid ? 'left-full ml-2' : 'right-full mr-2')}>
                          <Smile className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1">
                        <MessageReactions />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", msg.senderId === user?.uid && 'justify-end')}>
                      {/* Add timestamp formatting later */}
                      {/* <span>{msg.timestamp}</span> */}
                      {msg.senderId === user?.uid && <CheckCheck className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t bg-card p-4">
            <Card>
              <form ref={formRef} onSubmit={handleSendMessage} action={formAction}>
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
                    <Button type="submit" disabled={isSendDisabled}>
                      {isSafetyCheckPending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
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
        </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-background/50 text-center">
            <MessageCircle className="h-20 w-20 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Select a conversation</h3>
            <p className="text-muted-foreground">Choose a chat from the left to start messaging.</p>
          </div>
        )}
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

    