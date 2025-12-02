import { Timestamp, FieldValue } from 'firebase/firestore';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export type KittyGroupJoinRequest = {
  id: string;
  kittyGroupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: JoinRequestStatus;
  createdAt: Timestamp | FieldValue;
  reviewedAt?: Timestamp | FieldValue;
  reviewedBy?: string; // Admin user ID
  message?: string; // Optional message from user
};

export type TambolaGameJoinRequest = {
  id: string;
  tambolaGameId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: JoinRequestStatus;
  createdAt: Timestamp | FieldValue;
  reviewedAt?: Timestamp | FieldValue;
  reviewedBy?: string; // Admin user ID
  message?: string; // Optional message from user
};

