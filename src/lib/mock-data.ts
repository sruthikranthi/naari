

import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string, hint: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  if (img) return img.imageUrl;
  // Fallback to a picsum URL if not found in the JSON, which shouldn't happen
  return `https://picsum.photos/seed/${id}/400/300`;
};


export type User = {
  id: string;
  name: string;
  avatar: string;
  city: string;
  mobileNumber?: string | null;
  interests: string[];
  stories?: StoryItem[];
  kittyScore?: number;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Overdue';
  followerIds?: string[];
  followingIds?: string[];
  username?: string;
  education?: string;
  profession?: string;
  maritalStatus?: string;
  bannerImage?: string;
};

export type StoryItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration: number; // in seconds
  viewed?: boolean;
};

export type PollOption = {
  text: string;
  votes: number;
};

export type Post = {
  id: string;
  author: {
      id: string;
      name: string;
      avatar: string;
      city?: string;
  };
  content: string;
  image?: string;
  timestamp: any;
  likes: number;
  comments: number;
  isAnonymous: boolean;
  pollOptions?: PollOption[];
};

export type Chat = {
    id: string;
    participants: string[];
};

export type Message = {
    id: string;
    senderId: string;
    chatId: string;
    text: string;
    timestamp: any;
}

export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  image: string;
  bannerImage: string;
  leaderId: string;
  memberIds: string[];
};

export type KittyGroup = {
    id: string;
    name: string;
    contribution: number;
    nextTurn: string;
    nextDate: string;
    memberIds: string[];
}

export type Review = {
    id: string;
    author: string;
    rating: number;
    title: string;
    comment: string;
    date: string;
};

export type Product = {
  id: string;
  name: string;
  sellerId: string;
  seller: {
      id: string;
      name: string;
      avatar: string;
      city?: string;
  };
  price: number;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  category: string;
};

export type Course = {
  id: string;
  title: string;
  category: 'Business' | 'Beauty' | 'Health & Wellness' | 'Crafts' | 'Technology' | 'Finance';
  instructorId: string;
  instructor: string;
  duration: string;
  image: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  enrolledUserIds: string[];
};

export type SelfCareActivity = {
  icon: string;
  title: string;
  description: string;
};

export const selfCareActivities: SelfCareActivity[] = [
  {
    icon: 'Wind',
    title: 'Mindful Morning',
    description: 'Start your day with 5 minutes of mindful breathing.',
  },
  {
    icon: 'Coffee',
    title: 'Mindful Break',
    description: 'Take a 10-minute break away from your screens.',
  },
  {
    icon: 'Moon',
    title: 'Digital Detox',
    description: 'No screens for 1 hour before bed for better sleep.',
  },
  {
    icon: 'Leaf',
    title: 'Connect with Nature',
    description: 'Spend 15 minutes outdoors, observing your surroundings.',
  },
];
