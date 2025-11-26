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
import { Search, CheckCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { directory, type Professional } from '@/lib/directory';

const allSpecialties = [...new Set(directory.flatMap(p => p.specialties))];

export default function SupportDirectoryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const handleContact = (name: string) => {
    toast({
        title: 'Connecting you soon!',
        description: `Your request to connect with ${name} has been noted. This feature is coming soon.`
    })
  }

  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };

  const filteredProfessionals = useMemo(() => {
    return directory
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => selectedSpecialties.length === 0 || p.specialties.some(s => selectedSpecialties.includes(s)))
      .filter(p => !showVerifiedOnly || p.verified);
  }, [searchTerm, selectedSpecialties, showVerifiedOnly]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find Support"
        description="Connect with verified mental health professionals, counselors, and coaches."
      />
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
            {filteredProfessionals.map((prof) => (
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
                            <CardTitle className="text-2xl">{prof.name}</CardTitle>
                            <div className="flex flex-wrap gap-2 my-2">
                                {prof.specialties.map(spec => (
                                    <Badge key={spec} variant="outline">{spec}</Badge>
                                ))}
                            </div>
                            <CardDescription>{prof.description}</CardDescription>
                             <Button className="mt-4 w-full md:w-auto" onClick={() => handleContact(prof.name)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Contact {prof.name.split(' ')[0]}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
             {filteredProfessionals.length === 0 && (
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
