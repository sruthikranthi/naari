'use client';
import {
  Users,
  BookOpen,
  LineChart,
  BarChart,
  DollarSign,
  Eye,
  Mail,
  UserPlus,
  Star,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { courses, directory, users } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function ProfessionalHubPage() {
  // Assuming the logged-in user is a professional.
  // We'll use the first professional and first course creator from mock data.
  const professional = directory[0];
  const courseCreator = users[2];
  const creatorCourses = courses.filter(
    (c) => c.instructor === courseCreator.name
  );

  const incomingRequests = [
    { user: users[1], message: "Hi Dr. Gupta, I'd like to book a session." },
    { user: users[3], message: 'Looking for guidance on stress management.' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional & Creator Hub"
        description="Manage your professional activities and content."
      />
      <Tabs defaultValue="professional">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="professional">
            <Users className="mr-2 h-4 w-4" /> Professional View
          </TabsTrigger>
          <TabsTrigger value="creator">
            <BookOpen className="mr-2 h-4 w-4" /> Creator View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="professional" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {professional.name}</CardTitle>
              <CardDescription>
                Here's a summary of your activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Profile Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,250</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last month
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Connection Requests
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {incomingRequests.length} New
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Waiting for your response
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Earnings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹25,500</div>
                  <p className="text-xs text-muted-foreground">
                    This month so far
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incoming Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incomingRequests.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <Avatar>
                    <AvatarImage
                      src={`https://picsum.photos/seed/${req.user.id}/100/100`}
                    />
                    <AvatarFallback>
                      {req.user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{req.user.name}</p>
                    <p className="text-sm text-muted-foreground italic">
                      "{req.message}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Decline</Button>
                    <Button>Accept</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="creator" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {courseCreator.name}</CardTitle>
              <CardDescription>
                Here's a summary of your course performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Enrollments
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">852</div>
                  <p className="text-xs text-muted-foreground">
                    Across {creatorCourses.length} courses
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Rating
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">
                    Based on 120 reviews
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Earnings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹42,800</div>
                  <p className="text-xs text-muted-foreground">
                    This month so far
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creatorCourses.map((course) => (
                <div key={course.id} className="rounded-lg border p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium">250</p>
                      <p>Enrollments</p>
                    </div>
                    <div>
                      <p className="font-medium">85%</p>
                      <p>Completion Rate</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        ₹{((course.price || 0) * 250).toLocaleString()}
                      </p>
                      <p>Revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
