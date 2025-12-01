import { PlaceHolderImages } from './placeholder-images';
import type { Timestamp } from 'firebase/firestore';

const findImage = (id: string, hint: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (img) return img.imageUrl;
    return `https://picsum.photos/seed/${id}/600/400`;
};

export type Nominee = {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  comments: number;
  shares: number;
  hasVoted?: boolean;
  story: {
    text: string;
    image: string;
  };
};

export type JuryMember = {
  name: string;
  title: string;
  avatar: string;
};

export type Contest = {
  id: string;
  title: string;
  category: string;
  description: string;
  prize: string;
  endsIn: string;
  image: string;
  nominationFee: number;
  nominees: Nominee[];
  jury: JuryMember[];
  rules?: string;
  eligibility?: string;
  ageRange?: string;
  education?: string;
  maxNominees?: number | 'Unlimited';
  nominationEndDate?: string;
  createdAt?: Timestamp;
  status: 'Live' | 'Ended' | 'Pending Approval' | 'Community-run';
  likes?: number;
  commentCount?: number;
  winners?: {
    specialNomination?: string;
    first?: string;
    second?: string;
    third?: string;
  };
  winnersDeclaredAt?: Timestamp;
};
