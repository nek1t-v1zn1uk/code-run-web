export enum ProblemDifficulty {
    VERY_EASY = 'VERY_EASY',
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
    VERY_HARD = 'VERY_HARD'
}

export enum EvaluationType {
    EXACT_MATCH = 'EXACT_MATCH',
    SCRIPT_CHECK = 'SCRIPT_CHECK'
}

export interface ProblemTopic {
    id: number;
    name: string;
}

export interface ProblemDto {
    id: number;
    title: string;
    topic?: ProblemTopic | null;
    difficulty: ProblemDifficulty;
    statement: string;
    execution_time_limit_ms: number;
    execution_memory_limit_kb: number;
    default_evaluation_type?: EvaluationType | null;
    default_script_checker_id?: number | null;
    created_at: string;
}

export interface CreateProblemRequest {
    title: string;
    topic?: string | null;
    difficulty: ProblemDifficulty;
    statement: string;
    execution_time_limit_ms: number;
    execution_memory_limit_kb: number;
    default_evaluation_type: EvaluationType;
    default_script_checker_id?: number | null;
}

export interface UpdateProblemRequest {
    title?: string | null;
    topic?: string | null;
    difficulty?: ProblemDifficulty | null;
    statement?: string | null;
    execution_time_limit_ms?: number | null;
    execution_memory_limit_kb?: number | null;
    default_evaluation_type?: EvaluationType | null;
    default_script_checker_id?: number | null;
}

export interface ProblemPageResponse {
    content: ProblemDto[];
    has_next: boolean;
    next_cursor?: string | null;
    is_empty: boolean;
}
