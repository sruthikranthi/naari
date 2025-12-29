'use client';

import { useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader } from 'lucide-react';
import { createRedeemableItem, updateRedeemableItem } from '@/lib/fantasy/services';
import type { RedeemableItem, RewardCategory } from '@/lib/fantasy/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

interface RedeemableItemFormProps {
  firestore: Firestore;
  item?: RedeemableItem | null;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}

export function RedeemableItemForm({ firestore, item, onSuccess, toast }: RedeemableItemFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: (item?.category || 'voucher') as RewardCategory,
    coinCost: item?.coinCost || 0,
    imageUrl: item?.imageUrl || '',
    value: item?.value || '',
    terms: item?.terms || '',
    expiryDays: item?.expiryDays || undefined,
    stock: item?.stock !== undefined ? item.stock : undefined,
    isActive: item?.isActive ?? true,
    priority: item?.priority || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        await updateRedeemableItem(firestore, item.id, formData);
        toast({
          title: 'Success',
          description: 'Reward item updated successfully.',
        });
      } else {
        await createRedeemableItem(firestore, {
          ...formData,
          createdBy: user?.uid || 'admin',
        });
        toast({
          title: 'Success',
          description: 'Reward item created successfully.',
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save reward item.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., ₹500 Shopping Voucher"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
          placeholder="Describe the reward item..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as RewardCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="voucher">Voucher</SelectItem>
              <SelectItem value="gift">Gift</SelectItem>
              <SelectItem value="prize">Prize</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="cashback">Cashback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coinCost">Coin Cost *</Label>
          <Input
            id="coinCost"
            type="number"
            min="1"
            value={formData.coinCost}
            onChange={(e) => setFormData({ ...formData, coinCost: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder="e.g., ₹500, 20% off, Free shipping"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryDays">Expiry Days (optional)</Label>
          <Input
            id="expiryDays"
            type="number"
            min="1"
            value={formData.expiryDays || ''}
            onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Days until expiry"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock (optional, leave empty for unlimited)</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock !== undefined ? formData.stock : ''}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Available quantity"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Display Priority</Label>
        <Input
          id="priority"
          type="number"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
          placeholder="Higher = shown first"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          value={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          rows={2}
          placeholder="Terms and conditions for this reward..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive" className="cursor-pointer">Active (visible to users)</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          item ? 'Update Item' : 'Create Item'
        )}
      </Button>
    </form>
  );
}

