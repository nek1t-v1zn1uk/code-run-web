import { EvaluationType } from './problem.models';

export interface TestDto {
    id: number;
    problem_id: number;
    ordinal: number;
    is_example: boolean;
    input_data: string;
    expected_output?: string | null;
    override_evaluation_type?: EvaluationType | null;
    override_script_checker_id?: number | null;
    created_at: string;
}

export interface NewTestRequest {
    ordinal: number;
    is_example: boolean;
    input_data: string;
    expected_output?: string | null;
    override_evaluation_type?: EvaluationType | null;
    override_script_checker_id?: number | null;
}

export interface UpdateTestRequest {
    id: number;
    ordinal?: number | null;
    is_example?: boolean | null;
    input_data?: string | null;
    expected_output?: string | null;
    override_evaluation_type?: EvaluationType | null;
    override_script_checker_id?: number | null;
}

export interface DeleteTestRequest {
    id: number;
}

export interface UpdateTestListRequest {
    new_tests: NewTestRequest[];
    update_tests: UpdateTestRequest[];
    delete_tests: DeleteTestRequest[];
}
