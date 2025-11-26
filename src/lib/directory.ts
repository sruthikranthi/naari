
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string, hint: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  if (img) return img.imageUrl;
  return `https://picsum.photos/seed/${id}/100/100`;
};

export type Professional = {
  id: string;
  name: string;
  avatar: string;
  specialties: string[];
  description: string;
  verified: boolean;
  fees?: number;
};

export const directory: Professional[] = [
  {
    id: 'prof1',
    name: 'Dr. Ananya Gupta',
    avatar: findImage('user-3', 'woman professional'),
    specialties: ['Anxiety', 'Depression', 'Stress Management'],
    description: 'A compassionate psychologist with over 10 years of experience helping women navigate life\'s challenges. Her approach is rooted in CBT and mindfulness.',
    verified: true,
    fees: 1500,
  },
  {
    id: 'prof2',
    name: 'Sameera Khan',
    avatar: 'https://picsum.photos/seed/prof2/100/100',
    specialties: ['Relationship Counseling', 'Family Therapy'],
    description: 'A licensed therapist specializing in helping individuals and couples build healthier, more fulfilling relationships.',
    verified: true,
    fees: 1200,
  },
  {
    id: 'prof3',
    name: 'Dr. Priya Mehta',
    avatar: 'https://picsum.photos/seed/prof3/100/100',
    specialties: ['Postpartum Depression', 'Parenting Support'],
    description: 'A psychiatrist with a focus on perinatal mental health, providing support to new mothers and families.',
    verified: true,
    fees: 2000,
  },
  {
    id: 'prof4',
    name: 'Nidhi Sharma',
    avatar: 'https://picsum.photos/seed/prof4/100/100',
    specialties: ['Career Coaching', 'Work-Life Balance'],
    description: 'A certified coach who empowers women to achieve their professional goals while maintaining personal well-being.',
    verified: false,
  },
  {
    id: 'prof5',
    name: 'Dr. Fatima Ahmed',
    avatar: 'https://picsum.photos/seed/prof5/100/100',
    specialties: ['Grief & Loss', 'Trauma'],
    description: 'A therapist dedicated to providing a safe space for healing and growth after significant life events.',
    verified: true,
    fees: 1800,
  },
    {
    id: 'prof6',
    name: 'Sunita Joshi',
    avatar: 'https://picsum.photos/seed/prof6/100/100',
    specialties: ['Nutritional Counseling', 'Holistic Wellness'],
    description: 'A holistic wellness coach who combines nutritional advice with lifestyle changes for overall well-being.',
    verified: false,
    fees: 800,
  },
];
