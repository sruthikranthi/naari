
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Clock, User, BarChart2, BookCheck } from 'lucide-react';
import { courses as allCourses } from '@/lib/mock-data';
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
import { Progress } from '@/components/ui/progress';

const categories = [
  'All',
  'Business',
  'Beauty',
  'Health & Wellness',
  'Crafts',
];

export default function LearningPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const { toast } = useToast();

  const handleEnroll = (course: Course) => {
    if (enrolledCourses.find(c => c.id === course.id)) return;
    setEnrolledCourses([...enrolledCourses, course]);
    toast({
        title: 'Successfully Enrolled!',
        description: `You have been enrolled in "${course.title}". Find it in "My Learning".`,
    });
  };

  return (
    <div>
      <PageHeader
        title="Learning Zone"
        description="Empower yourself with new skills and knowledge."
      />

      <Tabs defaultValue="discover" className="w-full">
         <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">Discover Courses</TabsTrigger>
            <TabsTrigger value="my-learning">My Learning ({enrolledCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
            <DiscoverCourses onEnroll={handleEnroll} enrolledIds={enrolledCourses.map(c => c.id)} />
        </TabsContent>

        <TabsContent value="my-learning" className="mt-6">
           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.length > 0 ? (
                enrolledCourses.map((course) => (
                    <EnrolledCourseCard key={course.id} course={course} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">No courses enrolled yet</h3>
                    <p>Start discovering new skills in the "Discover Courses" tab.</p>
                </div>
              )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DiscoverCourses({ onEnroll, enrolledIds }: { onEnroll: (course: Course) => void; enrolledIds: string[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredCourses =
    activeCategory === 'All'
      ? allCourses
      : allCourses.filter((course) => course.category === activeCategory);
  
  return (
    <Tabs defaultValue="All" onValueChange={setActiveCategory} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
                <CourseCard 
                    key={course.id} 
                    course={course} 
                    onEnroll={onEnroll}
                    isEnrolled={enrolledIds.includes(course.id)}
                />
            ))}
            {filteredCourses.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
                <h3 className="text-lg font-semibold">No courses found in this category</h3>
                <p>Check back later for new courses!</p>
            </div>
            )}
        </div>
    </Tabs>
  )
}

function CourseCard({ course, onEnroll, isEnrolled }: { course: Course; onEnroll: (course: Course) => void; isEnrolled: boolean }) {
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
        <Button className="w-full" onClick={() => onEnroll(course)} disabled={isEnrolled}>
            {isEnrolled ? 'Enrolled' : 'Enroll Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}


function EnrolledCourseCard({ course }: { course: Course }) {
  // Mock progress
  const progress = Math.floor(Math.random() * (70 - 20 + 1)) + 20;

  return (
    <Card className="flex flex-col overflow-hidden">
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
        <h3 className="flex-grow font-headline text-lg font-bold">
          {course.title}
        </h3>
        <div className="mt-2 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="secondary" className="w-full">
            <BookCheck className="mr-2 h-4 w-4" />
            Continue Learning
        </Button>
      </CardFooter>
    </Card>
  );
}

