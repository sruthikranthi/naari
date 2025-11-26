
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
};

export const allContestsData: Contest[] = [
  {
    id: 'c1',
    title: 'NAARIMANI of the Year',
    category: 'Annual Award',
    description:
      'Celebrating the most inspirational and impactful woman in our community. Nominate someone who has made a significant difference.',
    prize: '₹1,00,000 + Trophy',
    endsIn: '45 days',
    image: 'https://picsum.photos/seed/naarimani/800/600',
    nominationFee: 0,
    rules: 'Nominee must be a registered member of Sakhi Circle. Self-nominations are allowed. Multiple entries for the same person are not allowed.',
    eligibility: 'Open to all Indian women who have made a significant social impact in the last year.',
    ageRange: '18+',
    education: 'Not Applicable',
    maxNominees: 'Unlimited',
    nominationEndDate: 'August 30, 2024',
    jury: [
        { name: 'Roshni Nadar', title: 'Chairperson, HCL', avatar: 'https://picsum.photos/seed/jury1/100/100' },
        { name: 'Falguni Nayar', title: 'Founder, Nykaa', avatar: 'https://picsum.photos/seed/jury2/100/100' },
        { name: 'Kiran Mazumdar-Shaw', title: 'Founder, Biocon', avatar: 'https://picsum.photos/seed/jury3/100/100' },
    ],
    nominees: [
      {
        id: 'n1',
        name: 'Dr. Ritu Sharma',
        avatar: 'https://picsum.photos/seed/nominee1/100/100',
        votes: 1250,
        comments: 45,
        shares: 82,
        story: {
          text: 'Dr. Sharma provides free medical care to underprivileged children in rural Rajasthan through her mobile clinic initiative.',
          image: 'https://picsum.photos/seed/nominee-story1/600/400',
        },
      },
      {
        id: 'n2',
        name: 'Sunita Devi',
        avatar: 'https://picsum.photos/seed/nominee2/100/100',
        votes: 980,
        comments: 32,
        shares: 65,
        story: {
          text: 'Sunita started a self-help group that has empowered over 200 women in her village to become financially independent through handicrafts.',
          image: 'https://picsum.photos/seed/nominee-story2/600/400',
        },
      },
    ],
  },
  {
    id: 'c2',
    title: 'Woman Entrepreneur of The Year',
    category: 'Business Award',
    description:
      'Recognizing the most innovative and successful woman-led business on our platform. Showcase your venture and win big!',
    prize: '₹50,000 Grant',
    endsIn: '60 days',
    image: 'https://picsum.photos/seed/entrepreneur/800/600',
    nominationFee: 500,
    rules: 'Business must be registered and operational for at least one year. Must be a woman-led business (over 50% ownership).',
    eligibility: 'For women entrepreneurs with a registered business in India.',
    ageRange: '21+',
    education: 'Graduate or equivalent experience.',
    maxNominees: 50,
    nominationEndDate: 'September 15, 2024',
    jury: [
        { name: 'Vani Kola', title: 'MD, Kalaari Capital', avatar: 'https://picsum.photos/seed/jury4/100/100' },
        { name: 'Radhika Gupta', title: 'CEO, Edelweiss MF', avatar: 'https://picsum.photos/seed/jury5/100/100' },
    ],
    nominees: [
       {
        id: 'n3',
        name: 'Priya Mehta',
        avatar: 'https://picsum.photos/seed/nominee3/100/100',
        votes: 480,
        comments: 21,
        shares: 40,
        story: {
          text: 'Priya founded "FarmFresh," an organic food delivery service that connects urban consumers directly with local farmers, ensuring fair prices for producers.',
          image: 'https://picsum.photos/seed/nominee-story3/600/400',
        },
      },
        {
        id: 'n4',
        name: 'Aisha Khan',
        avatar: 'https://picsum.photos/seed/nominee4/100/100',
        votes: 320,
        comments: 15,
        shares: 25,
        story: {
          text: 'Aisha created an ed-tech platform that teaches coding to young girls in Tier-2 and Tier-3 cities, bridging the digital divide.',
          image: 'https://picsum.photos/seed/nominee-story4/600/400',
        },
      },
    ],
  },
  {
    id: 'c3',
    title: 'Parashakthi Award for Bravery',
    category: 'Community Award',
    description:
      'Honoring extraordinary courage and resilience. Share a story of a woman who has overcome immense challenges with grace.',
    prize: 'Trophy + Feature',
    endsIn: '30 days',
    image: 'https://picsum.photos/seed/bravery/800/600',
    nominationFee: 0,
    jury: [
        { name: 'Mary Kom', title: 'Boxing Champion', avatar: 'https://picsum.photos/seed/jury6/100/100' },
        { name: 'Arunima Sinha', title: 'Mountaineer', avatar: 'https://picsum.photos/seed/jury7/100/100' },
    ],
    nominees: [],
  },
  {
    id: 'cc1',
    title: 'Best Home Chef',
    category: 'Cooking Contest',
    prize: 'Gift Hamper',
    endsIn: '15 days',
    image: 'https://picsum.photos/seed/homechef/800/600',
    nominationFee: 100,
    jury: [
        { name: 'Pooja Dhingra', title: 'Chef & Author', avatar: 'https://picsum.photos/seed/jury8/100/100' },
    ],
    nominees: [],
  },
   {
    id: 'cc2',
    title: 'DIY Craft Challenge',
    category: 'Creative Contest',
    prize: 'Voucher',
    endsIn: '20 days',
    image: 'https://picsum.photos/seed/diy/800/600',
    nominationFee: 50,
    jury: [
        { name: 'Lathika George', title: 'Author & Designer', avatar: 'https://picsum.photos/seed/jury9/100/100' },
    ],
    nominees: [],
  },
  {
    id: 'cc3',
    title: 'Photography Contest: Monsoon',
    category: 'Art Contest',
    prize: 'Feature',
    endsIn: '10 days',
    image: 'https://picsum.photos/seed/monsoon/800/600',
    nominationFee: 0,
    jury: [
        { name: 'Dayanita Singh', title: 'Photographer', avatar: 'https://picsum.photos/seed/jury10/100/100' },
    ],
    nominees: [],
  },
];

    