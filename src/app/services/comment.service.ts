import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentDto, CreateCommentDto } from '../models/comment.models';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = '/api/v1/problems';

  constructor(private http: HttpClient) {}

  getComments(problemId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.apiUrl}/${problemId}/comments`);
  }

  addComment(problemId: number, dto: CreateCommentDto): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.apiUrl}/${problemId}/comments`, dto);
  }
}
