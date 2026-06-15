export interface UserProfileDto {
    id: number;
    email: string;
    first_name: string;
    last_name: string | null;
    photo_url: string | null;
    role: string;
    created_at: string;
}

export interface UpdateProfileRequest {
    first_name: string;
    last_name?: string | null;
}

export interface ChangePasswordRequest {
    old_password: string;
    new_password: string;
}
