export type Difficulty = 'VERY_EASY' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

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

export interface Topic {
    name: string;
}

export interface ProblemTopic {
    id: number;
    name: string;
}

export interface Problem {
    id: number;
    title: string;
    topic: Topic | null;
    difficulty: Difficulty;
    statement: string;
    execution_time_limit_ms: number;
    execution_memory_limit_kb: number;
    default_evaluation_type: string;
    default_script_checker_id: number | null;
    created_at: string;
}

export interface ProblemsRequest {
    difficulty?: string;
    topicName?: string;
    limit: number;
    cursor?: string;
}

export interface ProblemsResponse {
    content: Problem[];
    has_next: boolean;
    next_cursor: string | null;
    is_empty: boolean;
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
