export type SolutionStatus =
  | 'IN_QUEUE'
  | 'RUNNING'
  | 'SUCCESS'
  | 'RUNTIME_ERROR'
  | 'TEST_FAILED'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export interface SolutionDto {
  id: number;
  problem_id: number;
  user_id: number;
  user_first_name?: string | null;
  user_last_name?: string | null;
  code: string;
  language: any; // Can be string or AvailableLanguage object depending on mapping
  status: SolutionStatus;
  test_case_reached?: number | null;
  execution_time_ms?: number | null;
  execution_memory_kb?: number | null;
  sent_at: string;
  executed_at?: string | null;
}

export interface SendSolutionRequest {
  code: string;
  language: string;
  language_version?: string | null;
  contest_id?: number | null;
  contest_problem_id?: number | null;
}
