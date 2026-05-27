export interface CommentDto {
  id: number;
  problem_id: number;
  user_id: number;
  user_first_name: string;
  user_last_name?: string;
  user_photo_url?: string;
  text: string;
  pinned_solution_id?: number;
  created_at: string;
  replies: CommentDto[];
}

export interface CreateCommentDto {
  text: string;
  parent_id?: number;
  pinned_solution_id?: number;
}
