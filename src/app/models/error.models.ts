export interface ApiErrorResponse {
    status: number;
    message?: string;
    timestamp: string;
    errors?: { [key: string]: string };
}
