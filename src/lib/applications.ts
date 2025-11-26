
export type ProfessionalApplication = {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    specialty: string;
    bio: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
};
