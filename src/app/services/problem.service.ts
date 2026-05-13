import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
    CreateProblemRequest, 
    ProblemDto, 
    ProblemPageResponse, 
    ProblemTopic, 
    UpdateProblemRequest 
} from '../models/problem.models';

@Injectable({
    providedIn: 'root'
})
export class ProblemService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1/problems`;

    getProblems(params?: any): Observable<ProblemPageResponse> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get<ProblemPageResponse>(this.baseUrl, { params: httpParams });
    }

    getProblemById(id: number): Observable<ProblemDto> {
        return this.http.get<ProblemDto>(`${this.baseUrl}/${id}`);
    }

    getTopics(): Observable<ProblemTopic[]> {
        return this.http.get<ProblemTopic[]>(`${this.baseUrl}/topics`);
    }

    createProblem(request: CreateProblemRequest): Observable<ProblemDto> {
        return this.http.post<ProblemDto>(this.baseUrl, request);
    }

    updateProblem(id: number, request: UpdateProblemRequest): Observable<ProblemDto> {
        return this.http.patch<ProblemDto>(`${this.baseUrl}/${id}`, request);
    }

    deleteProblem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
