export interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name?: string | null;
}

export interface RegisterResponse {
    email: string;
    first_name: string;
    last_name?: string | null;
    created_date: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    email: string;
    access_token: string;
    expire_date: string;
}
