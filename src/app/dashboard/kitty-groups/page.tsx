
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Users,
  Wallet,
  Calendar,
  IndianRupee,
  Trophy,
  ClipboardList,
  Cake,
  Plus,
} from 'lucide-react';
import { kittyGroups } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

const tools = [
  { icon: ClipboardList, name: 'Contribution Tracker' },
  { icon: Trophy, name: 'Winner Selection' },
  { icon: IndianRupee, name: 'Expense Tracking' },
  { icon: Cake, name: 'Event Planning' },
];

export default function KittyGroupsPage() {
  return (
    <div>
      <PageHeader
        title="Kitty Groups"
        description="Manage your digital kitty parties with ease."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-2xl font-bold font-headline">Your Groups</h2>
          {kittyGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="font-headline">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{group.members}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        ₹{group.contribution.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Contribution
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{group.nextTurn}</p>
                      <p className="text-xs text-muted-foreground">Next Turn</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{group.nextDate}</p>
                      <p className="text-xs text-muted-foreground">Next Date</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button asChild>
                    <Link href={`/dashboard/kitty-groups/${group.id}`}>Manage Group</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6 lg:col-span-1">
          <h2 className="text-2xl font-bold font-headline">Kitty Tools</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Button
                    key={tool.name}
                    variant="outline"
                    className="flex h-24 flex-col items-center justify-center gap-2"
                  >
                    <tool.icon className="h-6 w-6 text-primary" />
                    <span className="text-center text-xs">{tool.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create New Kitty Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Kitty Group</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sakhi's Monthly Meet"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contribution" className="text-right">
                    Contribution
                  </Label>
                  <div className="relative col-span-3">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="contribution"
                      type="number"
                      placeholder="2000"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="members" className="text-right">
                    Members
                  </Label>
                  <Input
                    id="members"
                    type="number"
                    placeholder="12"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Frequency
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="submit">Create Group</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
