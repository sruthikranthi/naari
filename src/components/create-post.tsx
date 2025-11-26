
'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Post } from '@/lib/mock-data';
import { BarChart, Image as ImageIcon, Video, X, Camera, Shield } from 'lucide-react';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CameraCapture } from './camera-capture';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { sanitizeText, validationSchemas } from '@/lib/validation';


export function CreatePost() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [content, setContent] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);


  const handlePost = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to create a post.',
        });
        return;
    }

    // Check email verification
    if (!user.emailVerified) {
      toast({
        variant: 'destructive',
        title: 'Email Not Verified',
        description: 'Please verify your email address before creating posts.',
      });
      return;
    }

    // Validate and sanitize content
    const sanitizedContent = content.trim();
    
    if (!sanitizedContent && !mediaPreview) {
      toast({
        variant: 'destructive',
        title: 'Cannot create empty post',
        description: 'Please write something or add media.',
      });
      return;
    }

    // Validate content length
    if (sanitizedContent.length > 5000) {
      toast({
        variant: 'destructive',
        title: 'Content Too Long',
        description: 'Post content must be less than 5000 characters.',
      });
      return;
    }

    // Sanitize poll options
    const sanitizedPollOptions = showPoll 
      ? pollOptions
          .filter(opt => opt.trim() !== '')
          .map(opt => ({ 
            text: opt.trim().substring(0, 100), // Limit poll option length
            votes: 0 
          }))
      : undefined;

    const newPost = {
      author: {
        id: user.uid,
        name: user.displayName || 'Anonymous Sakhi',
        avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      },
      content: sanitizedContent,
      timestamp: serverTimestamp(),
      likes: 0,
      comments: 0,
      isAnonymous,
      image: mediaType === 'image' ? mediaPreview! : undefined,
      pollOptions: sanitizedPollOptions
    };
    
    try {
        const postsCollection = collection(firestore, 'posts');
        await addDoc(postsCollection, newPost);
        toast({
            title: 'Post Created!',
            description: 'Your post has been shared with the community.',
        })

        // Reset form
        setContent('');
        setMediaPreview(null);
        setMediaType(null);
        setShowPoll(false);
        setPollOptions(['', '']);
        setIsAnonymous(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    } catch (error) {
        console.error("Error creating post: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not create post. Please try again.',
        });
    }
  };


  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };
  
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  }

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
      setShowPoll(false);
    }
  };

  const triggerFileSelect = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };
  
  const removeMedia = () => {
      setMediaPreview(null);
      setMediaType(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }

  const handleMediaCaptured = (dataUrl: string, type: 'image' | 'video') => {
    setMediaPreview(dataUrl);
    setMediaType(type);
    setIsCameraOpen(false);
    setShowPoll(false);
  };


  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage
              src={user?.photoURL || 'https://picsum.photos/seed/user1/100/100'}
              alt={user?.displayName || "User"}
              data-ai-hint="woman portrait"
            />
            <AvatarFallback>
              {user?.displayName
                ?.split(' ')
                .map((n) => n[0])
                .join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-3">
            <Textarea
              placeholder="What's on your mind, Sakhi?"
              className="border-none bg-secondary focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {mediaPreview && (
                <div className="relative">
                    {mediaType === 'image' ? (
                    <div className="relative max-h-80 w-full rounded-lg overflow-hidden">
                        <Image src={mediaPreview} alt="Preview" width={800} height={320} className="w-full h-auto object-contain" unoptimized />
                    </div>
                    ) : (
                    <video src={mediaPreview} controls className="max-h-80 w-full rounded-lg" />
                    )}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={removeMedia}
                    >
                        <X className="h-4 w-4" />
                    </Button>
              </div>
            )}

            {showPoll && !mediaPreview && (
              <div className="space-y-2">
                <Label>Poll Options</Label>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      placeholder={`Option ${index + 1}`} 
                      value={option}
                      onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removePollOption(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                 {pollOptions.length < 4 && (
                    <Button variant="outline" size="sm" onClick={addPollOption}>
                      Add Option
                    </Button>
                  )}
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex items-center gap-1">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button variant="ghost" size="icon" onClick={() => triggerFileSelect('image/*')}>
                  <ImageIcon className="text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => triggerFileSelect('video/*')}>
                  <Video className="text-muted-foreground" />
                </Button>
                 <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Camera className="text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Capture Selfie</DialogTitle>
                    </DialogHeader>
                    <CameraCapture onMediaCaptured={handleMediaCaptured} />
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => { setShowPoll(!showPoll); removeMedia(); }}>
                  <BarChart className="text-muted-foreground" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Label
                    htmlFor="anonymous-post"
                    className="flex cursor-pointer items-center gap-2 rounded-full py-1 px-3 text-sm font-normal text-muted-foreground transition-colors hover:bg-accent has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:text-primary has-[[data-state=checked]]:font-medium"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Post Anonymously</span>
                    <Checkbox 
                        id="anonymous-post" 
                        className="sr-only"
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    />
                  </Label>
                <Button size="sm" onClick={handlePost}>Post</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
