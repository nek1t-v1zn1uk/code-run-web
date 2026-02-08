export type Difficulty = 'VERY_EASY' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export interface Topic {
    name: string;
}

export interface Problem {
    id: number;
    title: string;
    topic: Topic;
    difficulty: Difficulty;
    statement: string;
    executionTimeLimitMs: number;
    executionMemoryLimitKb: number;
    defaultEvaluationType: string;
    defaultScriptCheckerId: number | null;
    createdAt: string;
}
