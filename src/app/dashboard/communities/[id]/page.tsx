
import { notFound } from 'next/navigation';
import { communities, posts, users } from '@/lib/mock-data';
import { CommunityClient } from './community-client';

const communityEvents = [
  {
    id: 'e1',
    title: 'Virtual Meetup: Summer Goals',
    date: 'July 30, 2024',
    time: '7:00 PM',
    platform: 'Zoom',
  },
  {
    id: 'e2',
    title: 'Workshop: Financial Planning for Beginners',
    date: 'August 12, 2024',
    time: '5:00 PM',
    platform: 'Google Meet',
  },
];

const communityResources = [
    {
        id: 'res1',
        title: 'Startup Funding Guide',
        description: 'A comprehensive guide on how to secure funding for your new venture.',
        link: 'https://www.forbes.com/advisor/business/startup-funding/'
    },
    {
        id: 'res2',
        title: 'Effective Marketing Strategies',
        description: 'Learn about the most effective marketing strategies for small businesses in 2024.',
        link: 'https://neilpatel.com/blog/marketing-strategies/'
    }
]

export default function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const community = communities.find((c) => c.id === id);
  const communityMembers = users.slice(0, 4);

  if (!community) {
    notFound();
  }

  return (
    <CommunityClient 
        community={community}
        communityMembers={communityMembers}
        communityEvents={communityEvents}
        posts={posts}
        initialResources={community.id === 'comm3' ? communityResources : []}
    />
  );
}
