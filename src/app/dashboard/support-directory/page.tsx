
'use client';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, MessageSquare, Plus, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Professional } from '@/lib/directory';
import { Skeleton } from '@/components/ui/skeleton';


const professionalSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters."),
    specialties: z.string().min(3, "Please list at least one specialty."),
    description: z.string().min(10, "Description must be at least 10 characters long."),
    verified: z.boolean().default(false),
    fees: z.coerce.number().min(0, "Fees cannot be negative.").optional(),
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;


export default function SupportDirectoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const directoryQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'directory') : null),
    [firestore, user]
  );
  const { data: professionals, isLoading: areProfessionalsLoading } = useCollection<Professional>(directoryQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contactedProfessionals, setContactedProfessionals] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
        verified: false,
    }
  });


  const handleContact = (profId: string, name: string) => {
    if (contactedProfessionals.includes(profId)) return;
    setContactedProfessionals([...contactedProfessionals, profId]);
    toast({
        title: 'Connection Request Sent',
        description: `Your request to connect with ${name} has been sent.`,
    });
  }

  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };
  
  const allSpecialties = useMemo(() => {
    if (!professionals) return [];
    return [...new Set(professionals.flatMap(p => p.specialties))];
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];
    return professionals
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => selectedSpecialties.length === 0 || p.specialties.some(s => selectedSpecialties.includes(s)))
      .filter(p => !showVerifiedOnly || p.verified);
  }, [professionals, searchTerm, selectedSpecialties, showVerifiedOnly]);

  const onAddProfessional = async (data: ProfessionalFormValues) => {
    if (!firestore) return;
    
    // Generate avatar URL - using timestamp in event handler is allowed (not during render)
    const timestamp = Date.now();
    const newProfessional: Omit<Professional, 'id'> = {
      name: data.name,
      avatar: `https://picsum.photos/seed/prof${timestamp}/100/100`,
      specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean),
      description: data.description,
      verified: data.verified,
      fees: data.fees,
    };

    try {
        await addDoc(collection(firestore, 'directory'), newProfessional);
        toast({
          title: 'Professional Added',
          description: `${data.name} has been added to the directory.`,
        });
        reset();
        setIsDialogOpen(false);
    } catch(e) {
        console.error("Error adding professional: ", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add professional. Please check permissions."
        })
    }
  };

  const isLoading = isUserLoading || areProfessionalsLoading;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <PageHeader
          title="Find Support"
          description="Connect with verified mental health professionals, counselors, and coaches."
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Professional
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit(onAddProfessional)}>
              <DialogHeader>
                <DialogTitle>Add a New Professional</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new expert to the directory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Input id="specialties" placeholder="e.g., Anxiety, Parenting Support" {...register('specialties')} />
                  {errors.specialties && <p className="mt-1 text-xs text-destructive">{errors.specialties.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="description">Description / Bio</Label>
                  <Textarea id="description" {...register('description')} />
                  {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="fees">Consultation Fee (₹)</Label>
                        <Input id="fees" type="number" placeholder="e.g., 1500" {...register('fees')} />
                        {errors.fees && <p className="mt-1 text-xs text-destructive">{errors.fees.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="avatar">Avatar Image</Label>
                        <Input id="avatar" type="file" accept="image/*" />
                        <p className="mt-1 text-xs text-muted-foreground">For demonstration only.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="verified" {...register('verified')} />
                    <Label htmlFor="verified">Mark as Verified</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit">Add Professional</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="search-professional">Search by name</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-professional"
                    placeholder="e.g., Ananya Gupta"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Specialties</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {allSpecialties.map(specialty => (
                    <div key={specialty} className="flex items-center gap-2">
                      <Checkbox 
                        id={`spec-${specialty}`}
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyChange(specialty)}
                      />
                      <Label htmlFor={`spec-${specialty}`} className="font-normal">{specialty}</Label>
                    </div>
                  ))}
                </div>
              </div>
               <div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="verified-only"
                        checked={showVerifiedOnly}
                        onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
                    />
                    <Label htmlFor="verified-only" className="font-semibold">Show verified only</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Directory Listing */}
        <main className="md:col-span-3 space-y-6">
            {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                               <Skeleton className="h-24 w-24 rounded-full" />
                            </div>
                            <div className="flex-1 space-y-3">
                               <Skeleton className="h-7 w-48" />
                               <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-5 w-24" />
                               </div>
                               <Skeleton className="h-4 w-full" />
                               <Skeleton className="h-4 w-3/4" />
                               <Skeleton className="h-10 w-40" />
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : filteredProfessionals.map((prof) => {
                const isContacted = contactedProfessionals.includes(prof.id);
                return (
                    <Card key={prof.id}>
                        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                <Avatar className="h-24 w-24 border-2 border-primary">
                                    <AvatarImage src={prof.avatar} alt={prof.name} />
                                    <AvatarFallback>{prof.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                {prof.verified && (
                                    <Badge variant="secondary" className="mt-2 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                    <div>
                                        <CardTitle className="text-2xl">{prof.name}</CardTitle>
                                        <div className="flex flex-wrap gap-2 my-2">
                                            {prof.specialties.map(spec => (
                                                <Badge key={spec} variant="outline">{spec}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {prof.fees && (
                                        <Badge className="text-lg mt-2 sm:mt-0">
                                            <IndianRupee className="mr-1 h-4 w-4" />
                                            {prof.fees.toLocaleString()}/session
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="mt-2">{prof.description}</CardDescription>
                                <Button 
                                    className="mt-4 w-full md:w-auto" 
                                    onClick={() => handleContact(prof.id, prof.name)}
                                    disabled={isContacted}
                                    variant={isContacted ? "secondary" : "default"}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {isContacted ? "Request Sent" : `Contact ${prof.name.split(' ')[0]}`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
             {!isLoading && filteredProfessionals.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">No professionals found</h3>
                    <p>Try adjusting your search filters.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
