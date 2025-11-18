'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Clock, User, BarChart2 } from 'lucide-react';
import { courses } from '@/lib/mock-data';
import type { Course } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const categories = [
  'All',
  'Business',
  'Beauty',
  'Health & Wellness',
  'Crafts',
];

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredCourses =
    activeTab === 'All'
      ? courses
      : courses.filter((course) => course.category === activeTab);

  return (
    <div>
      <PageHeader
        title="Learning Zone"
        description="Empower yourself with new skills and knowledge."
      />

      <Tabs defaultValue="All" onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
             {filteredCourses.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">No courses found in this category</h3>
                    <p>Check back later for new courses!</p>
                </div>
             )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
    const { toast } = useToast();

    const handleEnroll = () => {
        toast({
            title: 'Successfully Enrolled!',
            description: `You have been enrolled in "${course.title}".`,
        });
    };

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover"
            data-ai-hint="online course"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-4">
        <Badge variant="secondary" className="mb-2 w-fit">
          {course.category}
        </Badge>
        <h3 className="flex-grow font-headline text-lg font-bold">
          {course.title}
        </h3>
        <div className="mt-4 flex flex-col space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{course.instructor}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
           <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>{course.level}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleEnroll}>Enroll Now</Button>
      </CardFooter>
    </Card>
  );
}
