import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProblemDto } from '../models/problem.models';
import { ContestDto } from '../models/contest.models';

export interface HomeRecommendationsDto {
  in_progress_problems: ProblemDto[];
  trending_problems: ProblemDto[];
  active_contest: ContestDto | null;
  upcoming_contest: ContestDto | null;
  random_problem: ProblemDto | null;
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/v1/home`;

  getRecommendations(): Observable<HomeRecommendationsDto> {
    return this.http.get<HomeRecommendationsDto>(`${this.baseUrl}/recommendations`);
  }
}
