
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Hash } from 'lucide-react';

const hashtags = [
  { tag: 'KittyIdeas', posts: '1.2k' },
  { tag: 'SelfCare', posts: '5.8k' },
  { tag: 'WomenEntrepreneurs', posts: '3.4k' },
  { tag: 'MomFitness', posts: '2.1k' },
  { tag: 'MakeupMonday', posts: '980' },
];

export function TrendingHashtags() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trending Hashtags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hashtags.map((hashtag) => (
          <div key={hashtag.tag} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <Hash className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">#{hashtag.tag}</p>
                <p className="text-sm text-muted-foreground">
                  {hashtag.posts} posts
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
