
export type User = {
  id: string;
  name: string;
  avatar: string;
  city: string;
  interests: string[];
  stories?: StoryItem[];
  kittyScore?: number;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Overdue';
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
  author: User;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isAnonymous: boolean;
  pollOptions?: PollOption[];
};

export type Message = {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
}

export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  image: string;
  bannerImage: string;
};

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
  seller: User;
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
  category: 'Business' | 'Beauty' | 'Health & Wellness' | 'Crafts';
  instructor: string;
  duration: string;
  image: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
};

export type SelfCareActivity = {
  icon: string;
  title: string;
  description: string;
};


export const users: User[] = [
  { id: 'u1', name: 'Priya Sharma', avatar: '/assets/user-1.jpg', city: 'Mumbai', interests: ['Cooking', 'Yoga', 'Reading'], stories: [
      { id: 's1-1', type: 'image', url: 'https://picsum.photos/seed/story1/1080/1920', duration: 5 },
      { id: 's1-2', type: 'image', url: 'https://picsum.photos/seed/story2/1080/1920', duration: 5 },
  ], kittyScore: 95, paymentStatus: 'Paid' },
  { id: 'u2', name: 'Anjali Singh', avatar: '/assets/user-2.jpg', city: 'Delhi', interests: ['Gardening', 'Business', 'Movies'], stories: [
      { id: 's2-1', type: 'image', url: 'https://picsum.photos/seed/story3/1080/1920', duration: 5 },
  ], kittyScore: 88, paymentStatus: 'Paid' },
  { id: 'u3', name: 'Sneha Patel', avatar: '/assets/user-3.jpg', city: 'Bangalore', interests: ['Technology', 'Startups', 'Travel'], stories: [
      { id: 's3-1', type: 'image', url: 'https://picsum.photos/seed/story4/1080/1920', duration: 5 },
      { id: 's3-2', type: 'image', url: 'https://picsum.photos/seed/story5/1080/1920', duration: 5 },
      { id: 's3-3', type: 'image', url: 'https://picsum.photos/seed/story6/1080/1920', duration: 5 },
  ], kittyScore: 42, paymentStatus: 'Overdue' },
  { id: 'u4', name: 'Meera Das', avatar: '/assets/user-4.jpg', city: 'Kolkata', interests: ['Art', 'Music', 'History'], kittyScore: 99, paymentStatus: 'Paid' },
  { id: 'u5', name: 'Lakshmi Rao', avatar: '/assets/user-5.jpg', city: 'Chennai', interests: ['Finance', 'Investment', 'Crafts'], stories: [
      { id: 's5-1', type: 'image', url: 'https://picsum.photos/seed/story7/1080/1920', duration: 5 },
  ], kittyScore: 76, paymentStatus: 'Unpaid' },
];

export const communities: Community[] = [
  {
    id: 'comm1',
    name: 'Hyderabad Ladies',
    description: 'A space for all women in Hyderabad to connect, share, and grow together.',
    memberCount: 1200,
    image: 'https://picsum.photos/seed/commArt/400/300',
    bannerImage: 'https://picsum.photos/seed/comm1/1200/400'
  },
  {
    id: 'comm2',
    name: 'Parenting Circle',
    description: 'Join our circle of moms to share the joys and challenges of motherhood.',
    memberCount: 850,
    image: 'https://picsum.photos/seed/commRead/400/300',
    bannerImage: 'https://picsum.photos/seed/comm4/1200/400'
  },
  {
    id: 'comm3',
    name: 'Women in Business',
    description: 'A network for female entrepreneurs to collaborate and support each other.',
    memberCount: 2500,
    image: 'https://picsum.photos/seed/commGarden/400/300',
    bannerImage: 'https://picsum.photos/seed/comm3/1200/400'
  },
  {
    id: 'comm4',
    name: 'Fitness & Yoga',
    description: 'Your daily dose of motivation for a healthy body and mind.',
    memberCount: 5300,
    image: 'https://picsum.photos/seed/commTravel/400/300',
    bannerImage: 'https://picsum.photos/seed/comm2/1200/400'
  },
];

export const posts: Post[] = [
  {
    id: 'p1',
    author: users[0],
    content: "Just tried a new recipe for paneer butter masala and it turned out amazing! Who wants the recipe? 😋 #cooking #indianfood",
    timestamp: "2h ago",
    likes: 45,
    comments: 12,
    isAnonymous: false,
    image: 'https://picsum.photos/seed/post1/600/400'
  },
  {
    id: 'p4',
    author: users[3],
    content: "What should be our next kitty party theme?",
    timestamp: "3h ago",
    likes: 25,
    comments: 18,
    isAnonymous: false,
    pollOptions: [
      { text: 'Bollywood Retro', votes: 42 },
      { text: 'Masquerade Ball', votes: 28 },
      { text: '90s Nostalgia', votes: 15 },
    ]
  },
  {
    id: 'p2',
    author: users[2],
    content: "Feeling incredibly stressed with work lately. It's hard to find a balance. Any tips for managing work-life balance as an entrepreneur?",
    timestamp: "5h ago",
    likes: 120,
    comments: 34,
    isAnonymous: true,
  },
  {
    id: 'p3',
    author: users[1],
    content: "My little one said their first word today! My heart is so full. ❤️ #momlife #parenting",
    timestamp: "1d ago",
    likes: 210,
    comments: 56,
    isAnonymous: false,
    image: 'https://picsum.photos/seed/post2/600/400'
  }
];

const sampleReviews: Review[] = [
    { id: 'r1', author: 'Anjali S.', rating: 5, title: 'Absolutely beautiful!', comment: 'The quality is amazing and it looks even better in person. Highly recommend!', date: 'July 15, 2024' },
    { id: 'r2', author: 'Meera D.', rating: 4, title: 'Very nice product.', comment: 'Good value for money. The packaging was also very nice and secure.', date: 'July 10, 2024'},
    { id: 'r3', author: 'Priya S.', rating: 5, title: 'Loved it!', comment: 'Will definitely buy from this seller again. So talented!', date: 'July 5, 2024'}
];

export const products: Product[] = [
  {
    id: 'prod1',
    name: 'Handmade Scented Candles',
    seller: users[4],
    price: 499,
    description: 'Relax and unwind with our beautiful, handcrafted scented candles. Made with natural soy wax and premium fragrance oils, these candles come in a variety of soothing scents like Lavender, Vanilla, and Jasmine. Each candle is hand-poured into an elegant glass jar, perfect for any home decor. Burn time is approximately 40 hours.',
    images: [
      'https://picsum.photos/seed/product1/600/400',
      'https://picsum.photos/seed/candle-detail1/600/400',
      'https://picsum.photos/seed/candle-detail2/600/400',
    ],
    rating: 4.8,
    reviewCount: 150,
    reviews: sampleReviews.slice(0, 2),
    category: 'Home Decor',
  },
  {
    id: 'prod2',
    name: 'Gourmet Chocolate Box',
    seller: users[1],
    price: 899,
    description: 'Indulge in a box of our finest gourmet chocolates, made with love. This assorted box includes a variety of flavors like dark chocolate sea salt, milk chocolate almond, and white chocolate raspberry. Perfect for gifting or treating yourself. Contains 12 handcrafted chocolates.',
    images: [
      'https://picsum.photos/seed/product2/600/400',
      'https://picsum.photos/seed/choco-detail1/600/400',
      'https://picsum.photos/seed/choco-detail2/600/400',
    ],
    rating: 4.9,
    reviewCount: 210,
    reviews: sampleReviews,
    category: 'Food',
  },
  {
    id: 'prod3',
    name: 'Embroidered Kurti',
    seller: users[3],
    price: 1299,
    description: 'A beautifully designed cotton kurti with intricate embroidery. This comfortable and stylish piece is perfect for both casual and semi-formal occasions. Available in multiple sizes. Fabric: 100% Cotton. Care: Hand wash recommended.',
    images: [
      'https://picsum.photos/seed/product3/600/400',
      'https://picsum.photos/seed/kurti-detail1/600/400',
      'https://picsum.photos/seed/kurti-detail2/600/400',
    ],
    rating: 4.7,
    reviewCount: 95,
    reviews: sampleReviews.slice(1, 3),
    category: 'Fashion',
  },
  {
    id: 'prod4',
    name: 'Terracotta Wall Art',
    seller: users[0],
    price: 750,
    description: 'Add a touch of traditional elegance to your home with this handcrafted terracotta wall art. This piece is inspired by folk art and is hand-painted by our talented artist, Priya. Dimensions: 12-inch diameter.',
    images: [
      'https://picsum.photos/seed/product4/600/400',
      'https://picsum.photos/seed/art-detail1/600/400',
    ],
    rating: 4.8,
    reviewCount: 88,
    reviews: [sampleReviews[0]],
    category: 'Home Decor',
  },
  {
    id: 'prod5',
    name: 'Organic Rose Water Toner',
    seller: users[4],
    price: 350,
    description: 'Refresh and hydrate your skin with our pure, organic rose water toner. Steam-distilled from fresh rose petals, this toner helps balance skin pH, tighten pores, and provides a youthful glow. Free from alcohol and parabens. Size: 100ml.',
    images: [
      'https://picsum.photos/seed/product5/600/400',
      'https://picsum.photos/seed/toner-detail1/600/400',
    ],
    rating: 4.9,
    reviewCount: 302,
    reviews: sampleReviews,
    category: 'Beauty',
  },
  {
    id: 'prod6',
    name: 'Custom Calligraphy Service',
    seller: users[3],
    price: 1500,
    description: 'Personalize your wedding invitations, letters, or special announcements with our elegant calligraphy services. Price is for a set of 25 invitations. Please contact us for custom quotes and designs. We offer various scripts and ink colors.',
    images: [
      'https://picsum.photos/seed/product6/600/400',
      'https://picsum.photos/seed/calligraphy-detail1/600/400',
    ],
    rating: 5.0,
    reviewCount: 45,
    reviews: [],
    category: 'Services',
  },
  {
    id: 'prod7',
    name: 'Hand-painted Jute Bag',
    seller: users[3],
    price: 650,
    description: 'A stylish and eco-friendly jute bag, hand-painted with a unique design. Perfect for shopping, college, or a casual day out. Durable and spacious.',
    images: ['https://picsum.photos/seed/product7/600/400', 'https://picsum.photos/seed/jute-detail1/600/400'],
    rating: 4.6,
    reviewCount: 72,
    reviews: [sampleReviews[1]],
    category: 'Fashion',
  },
  {
    id: 'prod8',
    name: 'Spice Box (Masala Dabba)',
    seller: users[0],
    price: 950,
    description: 'A traditional stainless steel spice box with 7 compartments and a lid to keep your spices fresh. An essential for any Indian kitchen.',
    images: ['https://picsum.photos/seed/product8/600/400', 'https://picsum.photos/seed/masala-detail1/600/400'],
    rating: 4.9,
    reviewCount: 180,
    reviews: [sampleReviews[0], sampleReviews[2]],
    category: 'Kitchen',
  },
];


export type KittyGroup = {
  id: string;
  name: string;
  members: number;
  nextTurn: string;
  contribution: number;
  nextDate: string;
};

export const kittyGroups: KittyGroup[] = [
  {
    id: 'k1',
    name: "Sakhi's Monthly Meet",
    members: 12,
    nextTurn: 'Anjali Singh',
    contribution: 2000,
    nextDate: 'July 25, 2024'
  },
  {
    id: 'k2',
    name: 'City Friends Club',
    members: 15,
    nextTurn: 'Priya Sharma',
    contribution: 1000,
    nextDate: 'August 5, 2024'
  },
  {
    id: 'k3',
    name: "Wonder Women's Kitty",
    members: 10,
    nextTurn: 'Meera Das',
    contribution: 5000,
    nextDate: 'July 30, 2024'
  }
];

export const courses: Course[] = [
  {
    id: 'c1',
    title: 'Home Business 101',
    category: 'Business',
    instructor: 'Sneha Patel',
    duration: '4 Weeks',
    image: 'https://picsum.photos/seed/course-business1/600/400',
    level: 'Beginner',
  },
  {
    id: 'c2',
    title: 'Digital Marketing for Entrepreneurs',
    category: 'Business',
    instructor: 'Lakshmi Rao',
    duration: '6 Weeks',
    image: 'https://picsum.photos/seed/course-business2/600/400',
    level: 'Intermediate',
  },
  {
    id: 'c3',
    title: 'Intro to Pro Makeup',
    category: 'Beauty',
    instructor: 'Anjali Singh',
    duration: '5 Sessions',
    image: 'https://picsum.photos/seed/course-beauty1/600/400',
    level: 'Beginner',
  },
  {
    id: 'c4',
    title: 'Mindfulness and Meditation',
    category: 'Health & Wellness',
    instructor: 'Priya Sharma',
    duration: '4 Weeks',
    image: 'https://picsum.photos/seed/course-wellness1/600/400',
    level: 'Beginner',
  },
  {
    id: 'c5',
    title: 'Advanced Sewing Techniques',
    category: 'Crafts',
    instructor: 'Meera Das',
    duration: '8 Weeks',
    image: 'https://picsum.photos/seed/course-crafts1/600/400',
    level: 'Advanced',
  },
  {
    id: 'c6',
    title: 'Nutrition for a Healthy Life',
    category: 'Health & Wellness',
    instructor: 'Dr. Rina Verma',
    duration: '6 Sessions',
    image: 'https://picsum.photos/seed/course-wellness2/600/400',
    level: 'Intermediate',
  },
];


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
