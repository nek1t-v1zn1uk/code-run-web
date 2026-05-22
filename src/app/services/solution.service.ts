import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolutionDto, SendSolutionRequest } from '../models/solution.models';

@Injectable({ providedIn: 'root' })
export class SolutionService {
  private http = inject(HttpClient);
  private base = '/api/v1';

  sendSolution(problemId: number, request: SendSolutionRequest): Observable<SolutionDto> {
    return this.http.post<SolutionDto>(`${this.base}/problems/${problemId}/solutions`, request);
  }

  getSolution(solutionId: number): Observable<SolutionDto> {
    return this.http.get<SolutionDto>(`${this.base}/solutions/${solutionId}`);
  }
}
