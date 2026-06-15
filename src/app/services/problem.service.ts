import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
    CreateProblemRequest, 
    ProblemDto, 
    ProblemPageResponse, 
    ProblemTopic, 
    UpdateProblemRequest,
    Problem,
    ProblemsRequest,
    ProblemsResponse
} from '../models/problem.models';

@Injectable({
    providedIn: 'root'
})
export class ProblemService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1/problems`;

    getProblems(request: ProblemsRequest): Observable<ProblemPageResponse> {
        let params = new HttpParams().set('limit', request.limit.toString());
        if (request.difficulty) {
            params = params.set('difficulty', request.difficulty);
        }
        if (request.topicName) {
            params = params.set('topicName', request.topicName);
        }
        if (request.cursor) {
            params = params.set('cursor', request.cursor);
        }
        return this.http.get<ProblemPageResponse>(this.baseUrl, { params });
    }

    getAdminProblems(request: ProblemsRequest): Observable<ProblemPageResponse> {
        let params = new HttpParams().set('limit', request.limit.toString());
        if (request.difficulty) {
            params = params.set('difficulty', request.difficulty);
        }
        if (request.topicName) {
            params = params.set('topicName', request.topicName);
        }
        if (request.cursor) {
            params = params.set('cursor', request.cursor);
        }
        return this.http.get<ProblemPageResponse>(`${this.baseUrl}/admin`, { params });
    }

    getProblemById<T = ProblemDto>(id: number): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${id}`);
    }

    getTopics(): Observable<ProblemTopic[]> {
        return this.http.get<ProblemTopic[]>(`${this.baseUrl}/topics`);
    }

    createTopic(name: string): Observable<ProblemTopic> {
        return this.http.post<ProblemTopic>(`${environment.apiUrl}/v1/admin/topics`, { name });
    }

    updateTopic(id: number, name: string): Observable<ProblemTopic> {
        return this.http.put<ProblemTopic>(`${environment.apiUrl}/v1/admin/topics/${id}`, { name });
    }

    deleteTopic(id: number): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/v1/admin/topics/${id}`);
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
