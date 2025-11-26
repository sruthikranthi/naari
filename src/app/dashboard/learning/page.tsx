
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Clock, User, BarChart2, BookCheck, Plus, IndianRupee } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categories = [
  'Business',
  'Beauty',
  'Health & Wellness',
  'Crafts',
  'Technology',
  'Finance'
];

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  instructor: z.string().min(3, 'Instructor name is required.'),
  duration: z.string().min(2, 'Duration is required.'),
  category: z.string().nonempty('Please select a category.'),
  level: z.string().nonempty('Please select a level.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function LearningPage() {
  const [courses, setCourses] = useState<Course[]>(allCourses);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormValues>({
      resolver: zodResolver(courseSchema),
  });

  const handleEnroll = (course: Course) => {
    if (enrolledCourses.find(c => c.id === course.id)) return;
    setEnrolledCourses([...enrolledCourses, course]);
    toast({
        title: 'Successfully Enrolled!',
        description: `You have been enrolled in "${course.title}". Find it in "My Learning".`,
    });
  };

  const handleCreateCourse = (data: CourseFormValues) => {
    const newCourse: Course = {
        id: `c${Date.now()}`,
        title: data.title,
        category: data.category as Course['category'],
        instructor: data.instructor,
        duration: data.duration,
        level: data.level as Course['level'],
        price: data.price,
        image: `https://picsum.photos/seed/newCourse${courses.length + 1}/600/400`,
    };
    setCourses([newCourse, ...courses]);
    toast({
        title: 'Course Created!',
        description: `"${data.title}" has been added to the discoverable courses.`
    });
    reset();
    setIsCreateDialogOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Learning Zone"
          description="Empower yourself with new skills and knowledge."
        />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Create Course</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Course</DialogTitle>
                    <DialogDescription>Fill in the details below to add a new course to the Learning Zone.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleCreateCourse)} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Course Title</Label>
                        <Input id="title" {...register("title")} />
                        {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="instructor">Instructor</Label>
                            <Input id="instructor" {...register("instructor")} />
                            {errors.instructor && <p className="text-destructive text-xs mt-1">{errors.instructor.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" placeholder="e.g. 4 Weeks" {...register("duration")} />
                            {errors.duration && <p className="text-destructive text-xs mt-1">{errors.duration.message}</p>}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="level">Level</Label>
                             <Controller
                                name="level"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.level && <p className="text-destructive text-xs mt-1">{errors.level.message}</p>}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input id="price" type="number" placeholder="e.g., 499 or 0 for free" {...register("price")} />
                            {errors.price && <p className="text-destructive text-xs mt-1">{errors.price.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="image">Course Image</Label>
                            <Input id="image" type="file" accept="image/*" />
                            <p className="text-xs text-muted-foreground mt-1">For demonstration purposes only.</p>
                        </div>
                     </div>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Create Course</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="discover" className="w-full mt-6">
         <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">Discover Courses</TabsTrigger>
            <TabsTrigger value="my-learning">My Learning ({enrolledCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
            <DiscoverCourses courses={courses} onEnroll={handleEnroll} enrolledIds={enrolledCourses.map(c => c.id)} />
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

function DiscoverCourses({ courses, onEnroll, enrolledIds }: { courses: Course[], onEnroll: (course: Course) => void; enrolledIds: string[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredCourses =
    activeCategory === 'All'
      ? courses
      : courses.filter((course) => course.category === activeCategory);
  
  const allCategories = ['All', ...categories]

  return (
    <Tabs defaultValue="All" onValueChange={setActiveCategory} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7">
          {allCategories.map((category) => (
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
           <Badge className="absolute top-2 right-2 text-base">
            {course.price > 0 ? `₹${course.price.toLocaleString()}` : 'Free'}
           </Badge>
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
            {isEnrolled ? 'Enrolled' : `Enroll for ${course.price > 0 ? `₹${course.price}` : 'Free'}`}
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
        <Button variant="default" className="w-full">
            <BookCheck className="mr-2 h-4 w-4" />
            Continue Learning
        </Button>
      </CardFooter>
    </Card>
  );
}
