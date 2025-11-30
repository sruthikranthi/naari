'use client';

/**
 * Subscriptions Page
 * Display subscription plans and payment options
 */

import { useUser } from '@/firebase/provider';
import { CashfreePayment } from '@/components/cashfree-payment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Users, Gamepad2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  metadata?: Record<string, any>;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'yearly',
    name: 'Yearly Premium',
    description: 'Unlock all premium features for a full year',
    price: 49,
    icon: <Crown className="h-6 w-6" />,
    features: [
      'Access to all premium features',
      'Priority customer support',
      'Ad-free experience',
      'Exclusive content and events',
      'Early access to new features',
      'Unlimited posts and stories',
    ],
    popular: true,
    metadata: { type: 'yearly_subscription', duration: '1 year' },
  },
  {
    id: 'kitty-group',
    name: 'Kitty Group Premium',
    description: 'Create a new Kitty Group (one-time payment per group)',
    price: 1,
    icon: <Users className="h-6 w-6" />,
    features: [
      'Secure Kitty System',
      'Group insurance coverage',
      'Advanced payment tracking',
      'Priority support for group issues',
      'Custom group settings',
      'Analytics and insights',
    ],
    metadata: { type: 'kitty_group_subscription', duration: 'one-time per group' },
  },
  {
    id: 'tambola',
    name: 'Tambola Game',
    description: 'Play a Tambola game (per game payment)',
    price: 1,
    icon: <Gamepad2 className="h-6 w-6" />,
    features: [
      'Play one Tambola game',
      'Exclusive prize pools',
      'Real-time game updates',
      'Ticket management',
      'Game history',
      'Special event access',
    ],
    metadata: { type: 'tambola_game', duration: 'per game' },
  },
];

export default function SubscriptionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    toast({
      title: 'Subscription Activated',
      description: 'Your subscription has been activated successfully!',
    });
    
    // Redirect to payment status page
    router.push(`/dashboard/payments/status?orderId=${orderId}&status=completed`);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
  };

  if (selectedPlan) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedPlan(null)}
            className="mb-4"
          >
            ← Back to Plans
          </Button>
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">
            Complete payment for {selectedPlan.name}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedPlan.icon}
                {selectedPlan.name}
              </CardTitle>
              <CardDescription>{selectedPlan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">
                  ₹{selectedPlan.price}
                  <span className="text-lg font-normal text-muted-foreground">
                    {selectedPlan.metadata?.duration === '1 year' ? ' /year' : selectedPlan.metadata?.duration === 'lifetime' ? ' (one-time)' : ''}
                  </span>
                </div>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div>
            <CashfreePayment
              amount={selectedPlan.price}
              currency="INR"
              description={`${selectedPlan.name} - ${selectedPlan.description}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              metadata={{
                subscriptionType: selectedPlan.id,
                ...selectedPlan.metadata,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Choose Your Subscription</h1>
        <p className="text-muted-foreground text-lg">
          Unlock premium features and enhance your Naarimani experience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative transition-all hover:shadow-lg ${
              plan.popular ? 'border-primary shadow-md' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold">
                  ₹{plan.price}
                  {plan.metadata?.duration === '1 year' && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {' '}/year
                    </span>
                  )}
                  {plan.metadata?.duration === 'lifetime' && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {' '}one-time
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => setSelectedPlan(plan)}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              All subscriptions are processed securely through Cashfree. 
              You can cancel your subscription at any time from your account settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

