import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { posts } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-3xl">
      <PageHeader
        title="Home Feed"
        description="See what's new in your circle."
      />
      <div className="space-y-6">
        <CreatePost />
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
