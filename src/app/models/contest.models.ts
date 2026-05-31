export interface ContestDto {
    id: number;
    name: string | null;
    overview: string | null;
    rules: string | null;
    start_time: string;
    freeze_time: string | null;
    end_time: string;
}

export interface ContestProblemDto {
    id: number;
    contest_id: number;
    problem_id: number;
    ordinal: number;
}

export interface ContestMemberDto {
    id: number;
    user_id: number;
    contest_id: number;
    result_points: number | null;
    result_place: number | null;
}

export interface ProblemStatDto {
    problem_id: number;
    is_solved: boolean;
    unsuccessful_count: number;
    score: number;
}

export interface ContestProgressDto {
    solved_count: number;
    total_unsuccessful: number;
    total_score: number;
    problem_stats: { [key: number]: ProblemStatDto };
}

export interface ScoreboardDto {
    contest_id: number;
    rows: ScoreboardRowDto[];
}

export interface ScoreboardRowDto {
    user_id: number;
    username: string;
    solved_count: number;
    total_score: number;
    problem_stats: { [key: number]: ScoreboardProblemStatDto };
    place: number;
}

export interface ScoreboardProblemStatDto {
    problem_id: number;
    is_solved: boolean;
    unsuccessful_count: number;
    frozen_attempts: number;
    score: number;
}

export interface CreateContestRequest {
    name?: string | null;
    overview?: string | null;
    rules?: string | null;
    start_time: string;
    freeze_time?: string | null;
    end_time: string;
}

export interface UpdateContestRequest {
    name?: string | null;
    overview?: string | null;
    rules?: string | null;
    start_time?: string | null;
    freeze_time?: string | null;
    end_time?: string | null;
}

export interface AddContestProblemRequest {
    problem_id: number;
    ordinal: number;
}

export interface UpdateContestProblemsRequest {
    problem_ids: number[];
}
