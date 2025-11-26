/**
 * Integration tests for PostCard component
 */

import { render, screen } from '@/__tests__/utils/test-utils';
import { PostCard } from '@/components/post-card';
import { Timestamp } from 'firebase/firestore';
import { mockPost } from '@/__tests__/utils/test-utils';

describe('PostCard', () => {
  const mockPostWithTimestamp = {
    ...mockPost,
    timestamp: Timestamp.now(),
  };

  it('should render post content', () => {
    render(<PostCard post={mockPostWithTimestamp} />);
    expect(screen.getByText(mockPost.content)).toBeInTheDocument();
  });

  it('should render author name', () => {
    render(<PostCard post={mockPostWithTimestamp} />);
    expect(screen.getByText(mockPost.author.name)).toBeInTheDocument();
  });

  it('should render like button', () => {
    render(<PostCard post={mockPostWithTimestamp} />);
    const likeButton = screen.getByLabelText(/like post/i);
    expect(likeButton).toBeInTheDocument();
  });

  it('should render comment button', () => {
    render(<PostCard post={mockPostWithTimestamp} />);
    const commentButton = screen.getByLabelText(/comment/i);
    expect(commentButton).toBeInTheDocument();
  });

  it('should render share button', () => {
    render(<PostCard post={mockPostWithTimestamp} />);
    const shareButton = screen.getByLabelText(/share post/i);
    expect(shareButton).toBeInTheDocument();
  });

  it('should display like count', () => {
    render(<PostCard post={mockPostWithTimestamp} />);
    expect(screen.getByText(mockPost.likes.toString())).toBeInTheDocument();
  });
});

