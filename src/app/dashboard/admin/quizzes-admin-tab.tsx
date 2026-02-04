'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import {
  getAllSponsoredQuizzes,
  createSponsoredQuiz,
  updateSponsoredQuiz,
  deleteSponsoredQuiz,
} from '@/lib/quizzes/services';
import type { SponsoredQuiz, QuizQuestion, QuizMediaType, QuizPrizeType } from '@/lib/quizzes/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader,
  Plus,
  Edit,
  Trash2,
  Video,
  Image as ImageIcon,
  Users,
  Award,
  Building2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const QUESTION_COUNT = 5;
const DEFAULT_DURATION = 10;

interface QuizzesAdminTabProps {
  firestore: Firestore | null;
  user: FirebaseUser | null;
  toast: ReturnType<typeof useToast>['toast'];
}

const emptyQuestion: QuizQuestion = {
  questionText: '',
  type: 'multiple_choice',
  options: ['', '', '', ''],
  correctAnswer: 0,
};

export function QuizzesAdminTab({ firestore, user, toast }: QuizzesAdminTabProps) {
  const storage = useStorage();
  const [quizzes, setQuizzes] = useState<SponsoredQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<SponsoredQuiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingSponsor, setUploadingSponsor] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaType: 'image' as QuizMediaType,
    mediaUrl: '',
    mediaDurationSeconds: DEFAULT_DURATION,
    sponsorImageUrl: '',
    sponsorBrandName: '',
    maxParticipants: 0,
    prizeType: 'coins' as QuizPrizeType,
    prizeValue: '',
    isActive: true,
    questions: Array.from({ length: QUESTION_COUNT }, () => ({ ...emptyQuestion })),
  });

  const loadQuizzes = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const list = await getAllSponsoredQuizzes(firestore);
      setQuizzes(list);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quizzes.' });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      mediaDurationSeconds: DEFAULT_DURATION,
      sponsorImageUrl: '',
      sponsorBrandName: '',
      maxParticipants: 0,
      prizeType: 'coins',
      prizeValue: '',
      isActive: true,
      questions: Array.from({ length: QUESTION_COUNT }, () => ({ ...emptyQuestion })),
    });
    setEditingQuiz(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (quiz: SponsoredQuiz) => {
    setEditingQuiz(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description ?? '',
      mediaType: quiz.mediaType,
      mediaUrl: quiz.mediaUrl,
      mediaDurationSeconds: quiz.mediaDurationSeconds ?? DEFAULT_DURATION,
      sponsorImageUrl: quiz.sponsorImageUrl,
      sponsorBrandName: quiz.sponsorBrandName,
      maxParticipants: quiz.maxParticipants ?? 0,
      prizeType: quiz.prizeType,
      prizeValue: quiz.prizeValue,
      isActive: quiz.isActive,
      questions: quiz.questions.length === QUESTION_COUNT
        ? quiz.questions.map((q) => ({
            ...q,
            options: q.options ?? ['', '', '', ''],
          }))
        : [
            ...quiz.questions,
            ...Array.from({ length: QUESTION_COUNT - quiz.questions.length }, () => ({ ...emptyQuestion })),
          ].slice(0, QUESTION_COUNT),
    });
    setDialogOpen(true);
  };

  const handleUploadMedia = async (file: File) => {
    if (!user || !storage) return;
    setUploadingMedia(true);
    try {
      const path = `quiz-media/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, mediaUrl: url }));
      toast({ title: 'Uploaded', description: 'Media file uploaded.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload failed', description: String(e) });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUploadSponsor = async (file: File) => {
    if (!user || !storage) return;
    setUploadingSponsor(true);
    try {
      const path = `quiz-media/${user.uid}/sponsor_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, sponsorImageUrl: url }));
      toast({ title: 'Uploaded', description: 'Sponsor image uploaded.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload failed', description: String(e) });
    } finally {
      setUploadingSponsor(false);
    }
  };

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.mediaUrl.trim()) return 'Media (video/image) URL is required.';
    if (!form.sponsorBrandName.trim()) return 'Sponsor brand name is required.';
    if (form.questions.some((q) => !q.questionText.trim())) return 'All 5 questions must have text.';
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (q.type === 'multiple_choice') {
        if (!q.options?.length || q.options.some((o) => !o.trim())) return `Question ${i + 1}: all 4 options are required.`;
        const idx = Number(q.correctAnswer);
        if (idx < 0 || idx > 3) return `Question ${i + 1}: select a correct option (0-3).`;
      } else {
        if (typeof q.correctAnswer !== 'string' || !String(q.correctAnswer).trim()) return `Question ${i + 1}: correct answer is required.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!firestore || !user) return;
    const err = validateForm();
    if (err) {
      toast({ variant: 'destructive', title: 'Validation', description: err });
      return;
    }
    setSaving(true);
    try {
      const questions: QuizQuestion[] = form.questions.map((q) =>
        q.type === 'multiple_choice'
          ? { questionText: q.questionText.trim(), type: 'multiple_choice', options: q.options!.map((o) => o.trim()), correctAnswer: Number(q.correctAnswer) }
          : { questionText: q.questionText.trim(), type: 'text', correctAnswer: String(q.correctAnswer).trim() }
      );
      if (editingQuiz) {
        await updateSponsoredQuiz(firestore, editingQuiz.id, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          mediaType: form.mediaType,
          mediaUrl: form.mediaUrl.trim(),
          mediaDurationSeconds: form.mediaDurationSeconds,
          sponsorImageUrl: form.sponsorImageUrl.trim(),
          sponsorBrandName: form.sponsorBrandName.trim(),
          maxParticipants: form.maxParticipants,
          prizeType: form.prizeType,
          prizeValue: form.prizeValue.trim(),
          isActive: form.isActive,
          questions,
        });
        toast({ title: 'Updated', description: 'Quiz updated successfully.' });
      } else {
        await createSponsoredQuiz(firestore, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          mediaType: form.mediaType,
          mediaUrl: form.mediaUrl.trim(),
          mediaDurationSeconds: form.mediaDurationSeconds,
          sponsorImageUrl: form.sponsorImageUrl.trim(),
          sponsorBrandName: form.sponsorBrandName.trim(),
          maxParticipants: form.maxParticipants,
          prizeType: form.prizeType,
          prizeValue: form.prizeValue.trim(),
          questions,
          isActive: form.isActive,
          createdBy: user.uid,
        });
        toast({ title: 'Created', description: 'Quiz created successfully.' });
      }
      setDialogOpen(false);
      resetForm();
      loadQuizzes();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save quiz.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quiz: SponsoredQuiz) => {
    if (!firestore || !confirm(`Delete quiz "${quiz.title}"?`)) return;
    try {
      await deleteSponsoredQuiz(firestore, quiz.id);
      toast({ title: 'Deleted', description: 'Quiz deleted.' });
      loadQuizzes();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete quiz.' });
    }
  };

  if (!firestore || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Sign in to manage quizzes.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Sponsored Quizzes
          </CardTitle>
          <CardDescription>
            Create quizzes with 10s video/image, 5 questions, sponsor branding, participant cap, and prizes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No quizzes yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  quizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell className="font-medium">{quiz.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {quiz.sponsorImageUrl && (
                            <img src={quiz.sponsorImageUrl} alt="" className="h-6 w-6 rounded object-cover" />
                          )}
                          {quiz.sponsorBrandName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {quiz.mediaType === 'video' ? (
                          <Badge variant="secondary"><Video className="h-3 w-3 mr-1" /> Video</Badge>
                        ) : (
                          <Badge variant="secondary"><ImageIcon className="h-3 w-3 mr-1" /> Image</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {quiz.participantCount}
                        {quiz.maxParticipants > 0 && ` / ${quiz.maxParticipants}`}
                      </TableCell>
                      <TableCell>
                        {quiz.prizeType}: {quiz.prizeValue}
                      </TableCell>
                      <TableCell>
                        <Badge variant={quiz.isActive ? 'default' : 'secondary'}>
                          {quiz.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(quiz)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(quiz)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create Sponsored Quiz'}</DialogTitle>
            <DialogDescription>
              Media shows for 10 seconds, then 5 questions (4 options or text answer). Sponsor image and brand shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Quiz title"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Media type</Label>
                <Select
                  value={form.mediaType}
                  onValueChange={(v: QuizMediaType) => setForm((f) => ({ ...f, mediaType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video (10s)</SelectItem>
                    <SelectItem value="image">Image (10s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display duration (seconds)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.mediaDurationSeconds}
                  onChange={(e) => setForm((f) => ({ ...f, mediaDurationSeconds: Number(e.target.value) || DEFAULT_DURATION }))}
                />
              </div>
            </div>
            <div>
              <Label>Media URL (video or image)</Label>
              <div className="flex gap-2">
                <Input
                  value={form.mediaUrl}
                  onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                  placeholder="https://... or upload below"
                />
                <label className="flex items-center">
                  <input
                    type="file"
                    accept={form.mediaType === 'video' ? 'video/*' : 'image/*'}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadMedia(e.target.files[0])}
                    disabled={uploadingMedia}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>{uploadingMedia ? 'Uploading…' : 'Upload'}</span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium flex items-center gap-2 mb-2"><Building2 className="h-4 w-4" /> Sponsor</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand name</Label>
                  <Input
                    value={form.sponsorBrandName}
                    onChange={(e) => setForm((f) => ({ ...f, sponsorBrandName: e.target.value }))}
                    placeholder="Sponsor brand name"
                  />
                </div>
                <div>
                  <Label>Sponsor image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.sponsorImageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, sponsorImageUrl: e.target.value }))}
                      placeholder="Logo URL"
                    />
                    <label className="flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUploadSponsor(e.target.files[0])}
                        disabled={uploadingSponsor}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>{uploadingSponsor ? '…' : 'Upload'}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max participants (0 = unlimited)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxParticipants || ''}
                  onChange={(e) => setForm((f) => ({ ...f, maxParticipants: Number(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Prize type</Label>
                <Select
                  value={form.prizeType}
                  onValueChange={(v: QuizPrizeType) => setForm((f) => ({ ...f, prizeType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="money">Money</SelectItem>
                    <SelectItem value="gift_coupon">Gift coupon</SelectItem>
                    <SelectItem value="rewards">Rewards</SelectItem>
                    <SelectItem value="coins">Coins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Prize value (e.g. ₹500, Amazon ₹500, 50 coins)</Label>
                <Input
                  value={form.prizeValue}
                  onChange={(e) => setForm((f) => ({ ...f, prizeValue: e.target.value }))}
                  placeholder="Prize description or amount"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.isActive ? 'active' : 'inactive'}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === 'active' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Questions (exactly 5)</h4>
              <Tabs defaultValue="q0">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {form.questions.map((_, i) => (
                    <TabsTrigger key={i} value={`q${i}`}>Q{i + 1}</TabsTrigger>
                  ))}
                </TabsList>
                {form.questions.map((q, i) => (
                  <TabsContent key={i} value={`q${i}`} className="space-y-3 pt-2">
                    <Label>Question {i + 1} text</Label>
                    <Input
                      value={q.questionText}
                      onChange={(e) => {
                        const next = [...form.questions];
                        next[i] = { ...next[i], questionText: e.target.value };
                        setForm((f) => ({ ...f, questions: next }));
                      }}
                      placeholder="Question text"
                    />
                    <Select
                      value={q.type}
                      onValueChange={(v: 'multiple_choice' | 'text') => {
                        const next = [...form.questions];
                        next[i] = { ...next[i], type: v, options: v === 'multiple_choice' ? ['', '', '', ''] : undefined, correctAnswer: v === 'multiple_choice' ? 0 : '' };
                        setForm((f) => ({ ...f, questions: next }));
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">4 options</SelectItem>
                        <SelectItem value="text">Direct typing</SelectItem>
                      </SelectContent>
                    </Select>
                    {q.type === 'multiple_choice' && (
                      <>
                        {(q.options ?? ['', '', '', '']).map((opt, j) => (
                          <div key={j}>
                            <Label>Option {j + 1}</Label>
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const next = [...form.questions];
                                const opts = [...(next[i].options ?? ['', '', '', ''])];
                                opts[j] = e.target.value;
                                next[i] = { ...next[i], options: opts };
                                setForm((f) => ({ ...f, questions: next }));
                              }}
                              placeholder={`Option ${j + 1}`}
                            />
                          </div>
                        ))}
                        <div>
                          <Label>Correct option (0–3)</Label>
                          <Select
                            value={String(q.correctAnswer)}
                            onValueChange={(v) => {
                              const next = [...form.questions];
                              next[i] = { ...next[i], correctAnswer: Number(v) };
                              setForm((f) => ({ ...f, questions: next }));
                            }}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3].map((k) => (
                                <SelectItem key={k} value={String(k)}>Option {k + 1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    {q.type === 'text' && (
                      <div>
                        <Label>Correct answer (for typing)</Label>
                        <Input
                          value={String(q.correctAnswer)}
                          onChange={(e) => {
                            const next = [...form.questions];
                            next[i] = { ...next[i], correctAnswer: e.target.value };
                            setForm((f) => ({ ...f, questions: next }));
                          }}
                          placeholder="Correct answer"
                        />
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : null}
              {editingQuiz ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
