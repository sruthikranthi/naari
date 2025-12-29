'use client';

import { useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { updateRedemptionStatus } from '@/lib/fantasy/services';
import type { UserRedemption, RedemptionStatus } from '@/lib/fantasy/types';
import { useToast } from '@/hooks/use-toast';

interface RedemptionsManagerProps {
  firestore: Firestore;
  redemptions: UserRedemption[];
  onUpdate: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}

export function RedemptionsManager({ firestore, redemptions, onUpdate, toast }: RedemptionsManagerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<UserRedemption | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [notes, setNotes] = useState('');

  const handleUpdateStatus = async (redemption: UserRedemption, status: RedemptionStatus) => {
    setUpdatingId(redemption.id);
    try {
      await updateRedemptionStatus(
        firestore,
        redemption.id,
        status,
        voucherCode || undefined,
        notes || undefined
      );
      toast({
        title: 'Success',
        description: `Redemption ${status}.`,
      });
      setSelectedRedemption(null);
      setVoucherCode('');
      setNotes('');
      onUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update redemption.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {redemptions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No redemptions found.</p>
      ) : (
        <div className="space-y-3">
          {redemptions.map((redemption) => (
            <div key={redemption.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{redemption.itemName}</h4>
                    <Badge variant={
                      redemption.status === 'fulfilled' ? 'default' :
                      redemption.status === 'pending' ? 'secondary' :
                      redemption.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {redemption.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User: {redemption.userId.slice(0, 12)}... • Cost: {redemption.coinCost} coins
                  </p>
                  {redemption.voucherCode && (
                    <p className="text-sm font-mono mt-1">Code: {redemption.voucherCode}</p>
                  )}
                  {redemption.notes && (
                    <p className="text-xs text-muted-foreground mt-1">Notes: {redemption.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Redeemed: {redemption.redeemedAt && (
                      redemption.redeemedAt instanceof Date
                        ? redemption.redeemedAt.toLocaleString()
                        : (redemption.redeemedAt as any)?.toDate?.()?.toLocaleString() || 'N/A'
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {redemption.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRedemption(redemption)}
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(redemption, 'approved')}
                        disabled={updatingId === redemption.id}
                      >
                        {updatingId === redemption.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(redemption, 'rejected')}
                        disabled={updatingId === redemption.id}
                      >
                        {updatingId === redemption.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  {redemption.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(redemption, 'fulfilled')}
                      disabled={updatingId === redemption.id}
                    >
                      {updatingId === redemption.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mark Fulfilled'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Redemption Dialog */}
      {selectedRedemption && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <h4 className="font-semibold">Manage Redemption: {selectedRedemption.itemName}</h4>
          <div className="space-y-2">
            <Label htmlFor="voucherCode">Voucher Code (if applicable)</Label>
            <Input
              id="voucherCode"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Enter voucher/coupon code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add notes about this redemption..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleUpdateStatus(selectedRedemption, 'approved')}
              disabled={updatingId === selectedRedemption.id}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus(selectedRedemption, 'rejected')}
              disabled={updatingId === selectedRedemption.id}
              className="flex-1"
            >
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRedemption(null);
                setVoucherCode('');
                setNotes('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

