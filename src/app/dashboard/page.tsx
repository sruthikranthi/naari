import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { Stories } from '@/components/stories';
import { Suggestions } from '@/components/suggestions';
import { posts } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        <Stories />
        <CreatePost />
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="sticky top-20 hidden space-y-6 lg:block">
        <Suggestions />
      </div>
    </div>
  );
}
