'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Megaphone, 
  Image as ImageIcon, 
  Users, 
  TrendingUp, 
  Loader,
  Plus,
  Edit,
  Trash2,
  Eye,
  MousePointerClick,
  IndianRupee,
} from 'lucide-react';
import {
  getActiveCampaigns,
  getActiveSponsors,
  getAdStats,
} from '@/lib/ads/services';
import {
  getRevenueSummary,
  calculateCampaignRevenue,
} from '@/lib/ads/revenue';
import {
  getABTestResults,
  markWinningVariant,
} from '@/lib/ads/ab-testing';
import {
  checkCampaignPerformance,
  sendPerformanceReport,
} from '@/lib/ads/notifications';
import type {
  AdCampaign,
  Sponsor,
  AdCreative,
} from '@/lib/ads/types';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdsAdminTabProps {
  firestore: Firestore | null;
  user: FirebaseUser | null;
  toast: ReturnType<typeof useToast>['toast'];
}

export function AdsAdminTab({ firestore, user, toast }: AdsAdminTabProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'sponsors' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateSponsor, setShowCreateSponsor] = useState(false);

  useEffect(() => {
    if (firestore) {
      loadData();
    }
  }, [firestore]);

  const loadData = async () => {
    if (!firestore) return;
    
    setLoading(true);
    try {
      const [campaignsData, sponsorsData] = await Promise.all([
        getActiveCampaigns(firestore),
        getActiveSponsors(firestore),
      ]);
      setCampaigns(campaignsData);
      setSponsors(sponsorsData);
    } catch (error) {
      console.error('Error loading ads data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load ads data.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!firestore || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please sign in to manage ads.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Ad & Sponsorship Management
          </CardTitle>
          <CardDescription>
            Manage campaigns, sponsors, and track ad performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ad Campaigns</h3>
                <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Ad Campaign</DialogTitle>
                      <DialogDescription>
                        Create a new ad campaign for image ads.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateCampaignForm
                      firestore={firestore}
                      user={user}
                      toast={toast}
                      onSuccess={() => {
                        setShowCreateCampaign(false);
                        loadData();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No campaigns found. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      firestore={firestore}
                      onUpdate={loadData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sponsors Tab */}
            <TabsContent value="sponsors" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sponsors</h3>
                <Dialog open={showCreateSponsor} onOpenChange={setShowCreateSponsor}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sponsor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Sponsor</DialogTitle>
                      <DialogDescription>
                        Add a new sponsor (Overall or Event-level).
                      </DialogDescription>
                    </DialogHeader>
                    <CreateSponsorForm
                      firestore={firestore}
                      user={user}
                      toast={toast}
                      onSuccess={() => {
                        setShowCreateSponsor(false);
                        loadData();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sponsors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sponsors found. Add one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor) => (
                    <SponsorCard
                      key={sponsor.id}
                      sponsor={sponsor}
                      firestore={firestore}
                      onUpdate={loadData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard firestore={firestore} />
            </TabsContent>
            
            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-4">
              <RevenueDashboard firestore={firestore} />
            </TabsContent>
            
            {/* A/B Testing Tab */}
            <TabsContent value="ab-testing" className="space-y-4">
              <ABTestingDashboard firestore={firestore} toast={toast} />
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <NotificationsDashboard firestore={firestore} user={user} toast={toast} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Campaign Card Component
function CampaignCard({
  campaign,
  firestore,
  onUpdate,
}: {
  campaign: AdCampaign;
  firestore: Firestore;
  onUpdate: () => void;
}) {
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firestore) {
      loadCreatives();
    }
  }, [firestore, campaign.id]);

  const loadCreatives = async () => {
    try {
      const q = query(
        collection(firestore, 'ad_creatives'),
        where('campaignId', '==', campaign.id)
      );
      const snapshot = await getDocs(q);
      setCreatives(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AdCreative)));
    } catch (error) {
      console.error('Error loading creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    try {
      await updateDoc(doc(firestore, 'ad_campaigns', campaign.id), {
        active: !campaign.active,
        updatedAt: Timestamp.now(),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{campaign.name}</h3>
              <Badge variant={campaign.active ? 'default' : 'secondary'}>
                {campaign.active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{campaign.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{campaign.brandName}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Priority: {campaign.priority}</span>
              <span>Creatives: {creatives.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleActive}>
              {campaign.active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sponsor Card Component
function SponsorCard({
  sponsor,
  firestore,
  onUpdate,
}: {
  sponsor: Sponsor;
  firestore: Firestore;
  onUpdate: () => void;
}) {
  const toggleActive = async () => {
    try {
      await updateDoc(doc(firestore, 'sponsors', sponsor.id), {
        active: !sponsor.active,
        updatedAt: Timestamp.now(),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating sponsor:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{sponsor.name}</h3>
              <Badge variant={sponsor.active ? 'default' : 'secondary'}>
                {sponsor.active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{sponsor.sponsorshipType}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Priority: {sponsor.priority}</span>
              {sponsor.linkedGameIds && (
                <span>Games: {sponsor.linkedGameIds.length}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleActive}>
              {sponsor.active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Campaign Form
function CreateCampaignForm({
  firestore,
  user,
  toast,
  onSuccess,
}: {
  firestore: Firestore;
  user: FirebaseUser;
  toast: ReturnType<typeof useToast>['toast'];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    type: 'IMAGE' as AdCampaign['type'],
    priority: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(firestore, 'ad_campaigns'), {
        ...formData,
        active: true,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
      });

      toast({
        title: 'Success',
        description: 'Campaign created successfully!',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create campaign.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          id="brandName"
          value={formData.brandName}
          onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Campaign Type</Label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="IMAGE">Image Ad</option>
          <option value="OVERALL">Overall Campaign</option>
          <option value="EVENT">Event Campaign</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
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
        <Label htmlFor="priority">Priority (1-10, higher = more visible)</Label>
        <Input
          id="priority"
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Campaign'
        )}
      </Button>
    </form>
  );
}

// Create Sponsor Form
function CreateSponsorForm({
  firestore,
  user,
  toast,
  onSuccess,
}: {
  firestore: Firestore;
  user: FirebaseUser;
  toast: ReturnType<typeof useToast>['toast'];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    sponsorshipType: 'OVERALL' as Sponsor['sponsorshipType'],
    priority: 1,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(firestore, 'sponsors'), {
        ...formData,
        active: true,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast({
        title: 'Success',
        description: 'Sponsor added successfully!',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating sponsor:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add sponsor.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Sponsor Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          type="url"
          value={formData.logoUrl}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          required
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL (optional)</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sponsorshipType">Sponsorship Type</Label>
        <select
          id="sponsorshipType"
          value={formData.sponsorshipType}
          onChange={(e) => setFormData({ ...formData, sponsorshipType: e.target.value as any })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="OVERALL">Overall (Platform-wide)</option>
          <option value="EVENT">Event (Game-specific)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority (1-10, higher = more visible)</Label>
        <Input
          id="priority"
          type="number"
          min="1"
          max="10"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Sponsor'
        )}
      </Button>
    </form>
  );
}

// Analytics Dashboard
function AnalyticsDashboard({ firestore }: { firestore: Firestore | null }) {
  const [stats, setStats] = useState<{
    totalImpressions: number;
    totalClicks: number;
    overallCTR: number;
  }>({
    totalImpressions: 0,
    totalClicks: 0,
    overallCTR: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firestore) {
      loadStats();
    }
  }, [firestore]);

  const loadStats = async () => {
    if (!firestore) return;
    
    setLoading(true);
    try {
      const [impressionsSnapshot, clicksSnapshot] = await Promise.all([
        getDocs(collection(firestore, 'ad_impressions')),
        getDocs(collection(firestore, 'ad_clicks')),
      ]);

      const totalImpressions = impressionsSnapshot.size;
      const totalClicks = clicksSnapshot.size;
      const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      setStats({
        totalImpressions,
        totalClicks,
        overallCTR,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ad Performance Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Features</CardTitle>
          <CardDescription>
            Detailed analytics per campaign and sponsor coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Future enhancements will include:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Per-campaign impression and click tracking</li>
            <li>Per-sponsor exposure metrics</li>
            <li>Time-based analytics (daily, weekly, monthly)</li>
            <li>Revenue estimation</li>
            <li>User engagement metrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

