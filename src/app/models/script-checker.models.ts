export interface AvailableLanguage {
    id?: number | null;
    language: string;
    version: string;
}

export interface ScriptCheckerDto {
    id: number;
    name: string;
    language: AvailableLanguage;
    code: string;
    created_at: string;
}

export interface CreateScriptCheckerRequest {
    name: string;
    language: string;
    language_version?: string | null;
    code: string;
}

export interface UpdateScriptCheckerRequest {
    name?: string | null;
    language?: string | null;
    language_version?: string | null;
    code?: string | null;
}
