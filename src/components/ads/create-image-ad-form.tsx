'use client';

import { useState, useRef, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon, Loader, X } from 'lucide-react';
import { createAdCreative, updateAdCreative } from '@/lib/ads/services';
import { getAllSponsors } from '@/lib/ads/services';
import { getAllFantasyGames } from '@/lib/fantasy/services';
import { getAllFantasyCampaigns } from '@/lib/fantasy/campaign-services';
import type { Sponsor } from '@/lib/ads/types';
import type { FantasyGame } from '@/lib/fantasy/types';
import type { FantasyCampaign } from '@/lib/fantasy/campaign-types';
import type { AdCreative, RepeatInterval } from '@/lib/ads/types';
import { Timestamp } from 'firebase/firestore';
import Image from 'next/image';

interface CreateImageAdFormProps {
  firestore: Firestore;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  existingCreative?: AdCreative | null;
}

export function CreateImageAdForm({ firestore, userId, onSuccess, onCancel, toast, existingCreative }: CreateImageAdFormProps) {
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [games, setGames] = useState<FantasyGame[]>([]);
  const [campaigns, setCampaigns] = useState<FantasyCampaign[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(existingCreative?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sponsorId: existingCreative?.sponsorId || undefined as string | undefined,
    title: existingCreative?.title || '',
    description: existingCreative?.description || '',
    imageUrl: existingCreative?.imageUrl || '',
    clickUrl: existingCreative?.clickUrl || '',
    displayDuration: existingCreative?.displayDuration || 5,
    priority: existingCreative?.priority || 1,
    startDate: existingCreative?.startDate 
      ? (existingCreative.startDate instanceof Date 
          ? existingCreative.startDate.toISOString().split('T')[0]
          : (existingCreative.startDate as any)?.toDate?.()?.toISOString().split('T')[0] || '')
      : '',
    endDate: existingCreative?.endDate
      ? (existingCreative.endDate instanceof Date
          ? existingCreative.endDate.toISOString().split('T')[0]
          : (existingCreative.endDate as any)?.toDate?.()?.toISOString().split('T')[0] || '')
      : '',
    status: (existingCreative?.active ? 'active' : 'inactive') as 'active' | 'inactive',
    maxViews: existingCreative?.maxViews?.toString() || '',
    maxViewsPerUser: existingCreative?.maxViewsPerUser?.toString() || '',
    allowMultipleViews: existingCreative?.allowMultipleViews ?? true,
    repeatInterval: existingCreative?.repeatInterval || 'never' as RepeatInterval,
    minTimeBetweenViews: existingCreative?.minTimeBetweenViews?.toString() || '',
    targetCampaignIds: existingCreative?.targetCampaignIds?.join(', ') || '',
    targetGameIds: existingCreative?.targetGameIds?.join(', ') || '',
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allSponsors, allGames, allCampaigns] = await Promise.all([
          getAllSponsors(firestore).catch(() => []),
          getAllFantasyGames(firestore).catch(() => []),
          getAllFantasyCampaigns(firestore).catch(() => []),
        ]);
        setSponsors(allSponsors);
        setGames(allGames);
        setCampaigns(allCampaigns);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty arrays on error to prevent crashes
        setSponsors([]);
        setGames([]);
        setCampaigns([]);
      }
    };
    if (firestore) {
      loadData();
    }
  }, [firestore]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload PNG, JPG, or WebP image.',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Maximum file size is 5MB.',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (): Promise<string> => {
    if (!storage || !imageFile) {
      throw new Error('Storage or image file not available');
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileExtension = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `image-ads/${userId}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!imageFile && !formData.imageUrl) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please upload an ad image.',
      });
      return;
    }

    if (formData.displayDuration < 3 || formData.displayDuration > 30) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Display duration must be between 3 and 30 seconds.',
      });
      return;
    }

    setLoading(true);
    try {
      // Upload image if file selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await handleImageUpload();
      }

      // Parse target IDs
      const targetCampaignIds = formData.targetCampaignIds
        ? formData.targetCampaignIds.split(',').map(id => id.trim()).filter(Boolean)
        : undefined;
      
      const targetGameIds = formData.targetGameIds
        ? formData.targetGameIds.split(',').map(id => id.trim()).filter(Boolean)
        : undefined;

      const creativeData: Omit<AdCreative, 'id' | 'createdAt' | 'updatedAt' | 'order'> = {
        title: formData.title,
        imageUrl,
        clickUrl: formData.clickUrl || '#',
        altText: formData.title,
        displayDuration: formData.displayDuration,
        priority: formData.priority,
        active: formData.status === 'active',
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        allowMultipleViews: formData.allowMultipleViews,
        repeatInterval: formData.repeatInterval,
        aspectRatio: '16:9', // Default for full-screen gate
        ...(formData.sponsorId && { sponsorId: formData.sponsorId }),
        ...(formData.description && { description: formData.description }),
        ...(formData.maxViews && { maxViews: parseInt(formData.maxViews) }),
        ...(formData.maxViewsPerUser && { maxViewsPerUser: parseInt(formData.maxViewsPerUser) }),
        ...(formData.minTimeBetweenViews && { minTimeBetweenViews: parseInt(formData.minTimeBetweenViews) }),
        ...(targetCampaignIds && targetCampaignIds.length > 0 && { targetCampaignIds }),
        ...(targetGameIds && targetGameIds.length > 0 && { targetGameIds }),
      };

      if (existingCreative) {
        // Update existing creative
        await updateAdCreative(firestore, existingCreative.id, creativeData);
        toast({
          title: 'Ad Updated!',
          description: 'Image advertisement updated successfully.',
        });
      } else {
        // Create new creative
        await createAdCreative(firestore, creativeData);
        toast({
          title: 'Ad Created!',
          description: 'Image advertisement created successfully.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error creating ad:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create advertisement.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[90vh] overflow-y-auto p-1">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Details</CardTitle>
          <CardDescription>Basic information about the image advertisement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sponsorId">Sponsor *</Label>
            <Select
              value={formData.sponsorId || 'none'}
              onValueChange={(value) => setFormData({ ...formData, sponsorId: value === 'none' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sponsor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {sponsors.map((sponsor) => (
                  <SelectItem key={sponsor.id} value={sponsor.id}>
                    {sponsor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Advertisement title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the advertisement"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ad Image */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Image *</CardTitle>
          <CardDescription>
            Full-screen image ad gate (campaign/tournament entry)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recommended Image Size</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Dimensions: 1200×675px (16:9 aspect ratio)</p>
              <p>Max Size: 5MB</p>
              <p>Formats: PNG, JPG, WebP</p>
            </div>
          </div>

          {imagePreview ? (
            <div className="relative">
              <div className="border-2 border-dashed rounded-lg p-4">
                {/* Use regular img tag for data URLs, Image component for URLs */}
                {imagePreview.startsWith('data:') ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto rounded-lg max-h-96 object-contain"
                  />
                ) : (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={1200}
                    height={675}
                    className="w-full h-auto rounded-lg"
                    unoptimized
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          )}

          {!imagePreview && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Or enter image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayDuration">Display Duration (seconds) *</Label>
            <Input
              id="displayDuration"
              type="number"
              min="3"
              max="30"
              value={formData.displayDuration}
              onChange={(e) => setFormData({ ...formData, displayDuration: parseInt(e.target.value) || 5 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              How long users must view the ad (3-30 seconds)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="100"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-muted-foreground">
              Higher priority ads are shown first (1-100)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clickUrl">Click-Through URL</Label>
            <Input
              id="clickUrl"
              type="url"
              value={formData.clickUrl}
              onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              URL to open when users click the ad image
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Limits */}
      <Card>
        <CardHeader>
          <CardTitle>View Limits (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxViews">Max Views (optional)</Label>
            <Input
              id="maxViews"
              type="number"
              min="1"
              value={formData.maxViews}
              onChange={(e) => setFormData({ ...formData, maxViews: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxViewsPerUser">Max Views Per User (optional)</Label>
            <Input
              id="maxViewsPerUser"
              type="number"
              min="1"
              value={formData.maxViewsPerUser}
              onChange={(e) => setFormData({ ...formData, maxViewsPerUser: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>
        </CardContent>
      </Card>

      {/* Repeat Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Repeat Behavior</CardTitle>
          <CardDescription>
            Control how often the ad shows to the same user for the same campaign/tournament
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowMultipleViews"
              checked={formData.allowMultipleViews}
              onChange={(e) => setFormData({ ...formData, allowMultipleViews: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="allowMultipleViews" className="font-normal cursor-pointer">
              Allow Multiple Views
            </Label>
            <p className="text-xs text-muted-foreground">
              Allow showing this ad multiple times for the same campaign/tournament
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repeatInterval">Repeat Interval</Label>
            <Select
              value={formData.repeatInterval}
              onValueChange={(value) => setFormData({ ...formData, repeatInterval: value as RepeatInterval })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never (Show Once)</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="always">Always</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When to show the ad again after user has viewed it
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minTimeBetweenViews">Min Time Between Views (seconds, optional)</Label>
            <Input
              id="minTimeBetweenViews"
              type="number"
              min="1"
              value={formData.minTimeBetweenViews}
              onChange={(e) => setFormData({ ...formData, minTimeBetweenViews: e.target.value })}
              placeholder="e.g., 3600 (1 hour)"
            />
            <p className="text-xs text-muted-foreground">
              Minimum seconds between views (overrides repeat interval if set)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Targeting */}
      <Card>
        <CardHeader>
          <CardTitle>Targeting (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetCampaignIds">Target Campaigns (optional)</Label>
            <Input
              id="targetCampaignIds"
              value={formData.targetCampaignIds}
              onChange={(e) => setFormData({ ...formData, targetCampaignIds: e.target.value })}
              placeholder="Comma-separated campaign IDs"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to show for all campaigns
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetGameIds">Target Games (optional)</Label>
            <Input
              id="targetGameIds"
              value={formData.targetGameIds}
              onChange={(e) => setFormData({ ...formData, targetGameIds: e.target.value })}
              placeholder="Comma-separated game IDs"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to show for all games
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading || uploading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? 'Uploading...' : 'Creating...'}
            </>
          ) : (
            'Create Ad'
          )}
        </Button>
      </div>
    </form>
  );
}

