
'use client';
import Image from 'next/image';
import { useState, useRef } from 'react';
import {
  Edit,
  MapPin,
  Users,
  Briefcase,
  Award,
  Star,
  Baby,
  CheckCircle,
  Zap,
  Loader,
  UserPlus,
  Book,
  Heart,
  Building,
  Camera,
  Upload,
  Phone,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, deleteField } from 'firebase/firestore';

import type { User, Post as PostType, Community } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PostCard } from '@/components/post-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraCapture } from '@/components/camera-capture';

const profileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
    city: z.string().min(2, { message: 'City must be at least 2 characters.' }),
    mobileNumber: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\+?[0-9]{10,15}$/.test(value), {
        message: 'Enter a valid mobile number.',
      }),
    interests: z.string().optional(),
    education: z.string().optional(),
    profession: z.string().optional(),
    maritalStatus: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user: currentUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the current user's profile document
  const userDocRef = useMemoFirebase(() => currentUser ? doc(firestore, 'users', currentUser.uid) : null, [currentUser, firestore]);
  const { data: user, isLoading: isUserProfileLoading } = useDoc<User>(userDocRef);

  // Fetch posts authored by the current user
  const postsQuery = useMemoFirebase(() => currentUser ? query(collection(firestore, 'posts'), where('author.id', '==', currentUser.uid)) : null, [currentUser]);
  const { data: userPosts, isLoading: arePostsLoading } = useCollection<PostType>(postsQuery);

  // Fetch communities the user is a member of
  const communitiesQuery = useMemoFirebase(() => currentUser ? query(collection(firestore, 'communities'), where('memberIds', 'array-contains', currentUser.uid)) : null, [currentUser]);
  const { data: userCommunities, isLoading: areCommunitiesLoading } = useCollection<Community>(communitiesQuery);

  // Fetch profiles of users the current user is FOLLOWING
  const followingQuery = useMemoFirebase(() => (user?.followingIds && user.followingIds.length > 0) ? query(collection(firestore, 'users'), where('id', 'in', user.followingIds)) : null, [user]);
  const { data: followingUsers, isLoading: areFollowingLoading } = useCollection<User>(followingQuery);

  // Fetch profiles of users who are FOLLOWING the current user
  const followersQuery = useMemoFirebase(() => (user?.followerIds && user.followerIds.length > 0) ? query(collection(firestore, 'users'), where('id', 'in', user.followerIds)) : null, [user]);
  const { data: followerUsers, isLoading: areFollowersLoading } = useCollection<User>(followersQuery);


  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: { // Use values to auto-populate the form when user data loads
        name: user?.name || '',
        username: user?.username || '',
        city: user?.city || '',
        mobileNumber: user?.mobileNumber || '',
        interests: user?.interests?.join(', ') || '',
        education: user?.education || '',
        profession: user?.profession || '',
        maritalStatus: user?.maritalStatus || '',
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userDocRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.'});
        return;
    };

    const updatedData: Record<string, unknown> = {
      ...data,
      interests: data.interests?.split(',').map(interest => interest.trim()).filter(Boolean),
    };
    const trimmedMobile = data.mobileNumber?.trim();
    if (trimmedMobile) {
      updatedData.mobileNumber = trimmedMobile;
    } else {
      updatedData.mobileNumber = deleteField();
    }

    try {
        await updateDoc(userDocRef, updatedData);
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been successfully saved.',
        });
        setIsEditDialogOpen(false);
    } catch(e) {
        console.error('Error updating profile: ', e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your profile.' });
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if(!currentUser || !firestore) return;
    
    const currentUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    try {
      // Add target to current user's following list
      await updateDoc(currentUserRef, { followingIds: arrayUnion(targetUserId) });
      // Add current user to target's followers list
      await updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
      toast({ title: 'Followed!', description: `You are now following this user.`});
    } catch(e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not follow user.'});
    }
  }

  const handleUnfollow = async (targetUserId: string) => {
    if(!currentUser || !firestore) return;

    const currentUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', targetUserId);

    try {
      await updateDoc(currentUserRef, { followingIds: arrayRemove(targetUserId) });
      await updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
      toast({ title: 'Unfollowed', description: `You have unfollowed this user.`});
    } catch(e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not unfollow user.'});
    }
  }

  const handleImageUpload = async (type: 'avatar' | 'banner', dataUrl?: string) => {
    if (!userDocRef) return;
    
    let newImageUrl: string;

    if (dataUrl) {
        // This is where you would upload the dataUrl to Firebase Storage
        // For now, we'll just use the dataUrl directly for a preview effect
        newImageUrl = dataUrl;
    } else {
        // Fallback for file upload simulation
        newImageUrl = `https://picsum.photos/seed/${type}${Date.now()}/${type === 'avatar' ? '200' : '1200'}/${type === 'avatar' ? '200' : '400'}`;
    }
    
    const fieldToUpdate = type === 'avatar' ? 'avatar' : 'bannerImage';

    try {
        await updateDoc(userDocRef, { [fieldToUpdate]: newImageUrl });
        toast({
            title: `${type === 'avatar' ? 'Profile Photo' : 'Banner'} Updated!`,
            description: 'Your new image has been saved.',
        });
    } catch (e) {
        console.error(`Error updating ${type}:`, e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your image.' });
    } finally {
        setIsAvatarDialogOpen(false);
    }
  }

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  }

  const userBadges = [
    { icon: Baby, label: 'Super Mom' },
    { icon: Briefcase, label: 'Top Seller' },
    { icon: Award, label: 'Kitty Leader' },
    { icon: Star, label: 'Helpful Sister' },
  ];
  
  const isLoading = isUserLoading || isUserProfileLoading || arePostsLoading || areCommunitiesLoading || areFollowingLoading || areFollowersLoading;

  if (isLoading || !user) {
      return (
          <div className="space-y-6">
              <Card>
                <div className="relative h-48 w-full bg-muted md:h-64">
                    <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="relative p-6 pt-0">
                    <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
                        <div className="-mt-20 shrink-0 md:-mt-24">
                           <Skeleton className="h-32 w-32 rounded-full md:h-40 md:w-40 border-4 border-card" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:ml-6 md:text-left">
                            <Skeleton className="h-9 w-48" />
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </div>
                </CardContent>
              </Card>
              <Tabs defaultValue="activity">
                  <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="about">About</TabsTrigger>
                      <TabsTrigger value="connections">Connections</TabsTrigger>
                      <TabsTrigger value="communities">Communities</TabsTrigger>
                  </TabsList>
                  <TabsContent value="activity" className="mt-6">
                       <Skeleton className="h-48 w-full" />
                  </TabsContent>
              </Tabs>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="group relative h-48 w-full bg-muted md:h-64">
            <Image
              src={user.bannerImage || "https://picsum.photos/seed/profile-banner/1200/400"}
              alt="Profile banner"
              fill
              className="object-cover"
              data-ai-hint="abstract texture"
            />
            <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/30" />
            <input type="file" ref={fileInputRef} onChange={() => handleImageUpload('banner')} className="hidden" accept="image/*" />
            <Button 
                variant="secondary" 
                className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={triggerFileUpload}
            >
                <Camera className="mr-2 h-4 w-4" />
                Edit Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative p-6 pt-0">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
            <div className="group relative -mt-20 shrink-0 md:-mt-24">
              <Avatar className="h-32 w-32 border-4 border-card md:h-40 md:w-40">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  data-ai-hint="woman portrait"
                />
                <AvatarFallback className="text-5xl">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
               <input type="file" ref={fileInputRef} onChange={() => handleImageUpload('avatar')} className="hidden" accept="image/*" />
               <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                 <DialogTrigger asChild>
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <Camera className="h-4 w-4"/>
                        <span className="sr-only">Edit Profile Photo</span>
                    </Button>
                 </DialogTrigger>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Profile Photo</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={triggerFileUpload}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Photo
                        </Button>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button><Camera className="mr-2 h-4 w-4"/> Take Selfie</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Take a Selfie</DialogTitle>
                                </DialogHeader>
                                <div className="h-96">
                                    <CameraCapture onMediaCaptured={(dataUrl) => handleImageUpload('avatar', dataUrl)} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                 </DialogContent>
               </Dialog>
            </div>
            <div className="flex-1 text-center md:ml-6 md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              {user.username && <p className="text-muted-foreground">@{user.username}</p>}
              <p className="flex items-center justify-center text-muted-foreground md:justify-start">
                <MapPin className="mr-1.5 h-4 w-4" />
                {user.city}
              </p>
              <div className="mt-2 flex justify-center md:justify-start gap-4 text-sm">
                <span className="font-semibold">{user.followerIds?.length || 0} Followers</span>
                <span className="font-semibold">{user.followingIds?.length || 0} Following</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => reset()}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                     <DialogDescription>
                        Make changes to your profile here. Click save when you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                     <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" {...register('username')} placeholder="e.g. priya_sharma" />
                        {errors.username && <p className="text-destructive text-xs mt-1">{errors.username.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register('city')} />
                         {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                        <Input id="mobileNumber" {...register('mobileNumber')} placeholder="+911234567890" />
                        {errors.mobileNumber && <p className="text-destructive text-xs mt-1">{errors.mobileNumber.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="education">Education</Label>
                        <Input id="education" placeholder="e.g., MBA in Marketing" {...register('education')} />
                      </div>
                       <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="profession">Profession</Label>
                             <Controller
                                name="profession"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Working Professional">Working Professional</SelectItem>
                                            <SelectItem value="Homemaker">Homemaker</SelectItem>
                                            <SelectItem value="Student">Student</SelectItem>
                                            <SelectItem value="Business Owner">Business Owner</SelectItem>
                                            <SelectItem value="Looking for work">Looking for work</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                         <div>
                            <Label htmlFor="maritalStatus">Marital Status</Label>
                             <Controller
                                name="maritalStatus"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                            <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                                            <SelectItem value="Divorced">Divorced</SelectItem>
                                            <SelectItem value="Widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                       </div>
                      <div>
                        <Label htmlFor="interests">Interests</Label>
                        <Input
                          id="interests"
                          {...register('interests')}
                          placeholder="e.g. Cooking, Yoga, Reading"
                        />
                         <p className="text-xs text-muted-foreground mt-1">Separate interests with a comma.</p>
                      </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            {userPosts && userPosts.length > 0 ? (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-center text-muted-foreground py-10">No posts yet.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About {user.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                 {user.profession && <div className="flex items-center gap-3"><Briefcase className="h-5 w-5 text-primary" /> <div><p className="font-semibold">Profession</p><p className="text-muted-foreground">{user.profession}</p></div></div>}
                 {user.education && <div className="flex items-center gap-3"><Book className="h-5 w-5 text-primary" /> <div><p className="font-semibold">Education</p><p className="text-muted-foreground">{user.education}</p></div></div>}
                 {user.maritalStatus && <div className="flex items-center gap-3"><Heart className="h-5 w-5 text-primary" /> <div><p className="font-semibold">Marital Status</p><p className="text-muted-foreground">{user.maritalStatus}</p></div></div>}
                {user.mobileNumber && <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> <div><p className="font-semibold">Mobile Number</p><p className="text-muted-foreground">{user.mobileNumber}</p></div></div>}
                 {user.city && <div className="flex items-center gap-3"><Building className="h-5 w-5 text-primary" /> <div><p className="font-semibold">City</p><p className="text-muted-foreground">{user.city}</p></div></div>}
               </div>

              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests && user.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Badges</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {userBadges.map((badge) => (
                    <div
                      key={badge.label}
                      className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <badge.icon className="h-6 w-6" />
                      </div>
                      <p className="text-center text-sm font-medium">
                        {badge.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Stats</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">{userPosts?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">128</p>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">
                      {user.followingIds?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">
                      {userCommunities?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Communities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="following" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Following ({followingUsers?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {followingUsers && followingUsers.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar>
                      <AvatarImage
                        src={connection.avatar}
                        alt={connection.name}
                        data-ai-hint="woman portrait"
                      />
                      <AvatarFallback>
                        {connection.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{connection.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.city}
                      </p>
                    </div>
                     <Button variant="secondary" size="sm" onClick={() => handleUnfollow(connection.id)}>Unfollow</Button>
                  </CardContent>
                </Card>
              ))}
               {(!followingUsers || followingUsers.length === 0) && (
                    <p className="col-span-full py-10 text-center text-muted-foreground">Not following anyone yet.</p>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Followers ({followerUsers?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {followerUsers && followerUsers.map((connection) => {
                const isFollowing = user.followingIds?.includes(connection.id);
                return (
                    <Card key={connection.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                        <Avatar>
                        <AvatarImage
                            src={connection.avatar}
                            alt={connection.name}
                            data-ai-hint="woman portrait"
                        />
                        <AvatarFallback>
                            {connection.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                        <p className="font-semibold">{connection.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {connection.city}
                        </p>
                        </div>
                        {isFollowing ? (
                            <Button variant="secondary" size="sm" onClick={() => handleUnfollow(connection.id)}>Following</Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleFollow(connection.id)}>Follow Back</Button>
                        )}
                    </CardContent>
                    </Card>
                )
              })}
               {(!followerUsers || followerUsers.length === 0) && (
                    <p className="col-span-full py-10 text-center text-muted-foreground">No followers yet.</p>
                )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

    