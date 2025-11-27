
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Shield, ScrollText, FileX2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const policyLinks = [
  { href: '/policies/terms', icon: FileText, title: 'Terms & Conditions', description: 'The rules for using our service.' },
  { href: '/policies/privacy', icon: Shield, title: 'Privacy Policy', description: 'How we handle your data.' },
  { href: '/policies/refund', icon: ScrollText, title: 'Refund Policy', description: 'Our policy on refunds for purchases.' },
  { href: '/policies/cancellation', icon: FileX2, title: 'Cancellation Policy', description: 'How to cancel subscriptions or services.' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <Card>
        <CardHeader>
          <CardTitle>Legal & Policies</CardTitle>
          <CardDescription>
            Review our terms, policies, and legal documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policyLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-start gap-4">
                    <link.icon className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </Link>
                {index < policyLinks.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Owner Information</CardTitle>
          <CardDescription>
            These details are shared with our payment partners to verify platform ownership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-foreground">Legal Owner Name</dt>
              <dd className="text-muted-foreground">Venkat Kumar Suyradevara</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Registered Address</dt>
              <dd className="text-muted-foreground">
                H No 13-1-143/D/2, Flat 402, Sai Towers, Mattewada, Warangal, Telangana - 506002
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Email</dt>
              <dd className="text-muted-foreground">restart.guru25@gmail.com</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Mobile Number</dt>
              <dd className="text-muted-foreground">+91 91330 77023</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
