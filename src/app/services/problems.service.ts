import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Problem, Topic } from '../models/problem.model';

export interface ProblemsRequest {
    difficulty?: string;
    topicName?: string;
    limit: number;
    cursor?: string;
}

export interface ProblemsResponse {
    content: Problem[];
    hasNext: boolean;
    nextCursor: string;
    isEmpty: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ProblemsService {
    private readonly apiUrl = `${environment.apiUrl}/v1/problems`;

    constructor(private http: HttpClient) { }

    getProblems(request: ProblemsRequest): Observable<ProblemsResponse> {
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

        return this.http.get<ProblemsResponse>(this.apiUrl, { params });
    }

    getProblemById(id: number): Observable<Problem> {
        return this.http.get<Problem>(`${this.apiUrl}/${id}`);
    }

    getTopics(): Observable<Topic[]> {
        return this.http.get<Topic[]>(`${this.apiUrl}/topics`);
    }
}
