import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Problem, Topic } from '../models/problem.model';

@Injectable({
    providedIn: 'root'
})
export class ProblemsService {
    private readonly apiUrl = `${environment.apiUrl}/v1/problems`;

    constructor(private http: HttpClient) { }

    getProblems(): Observable<Problem[]> {
        return this.http.get<Problem[]>(this.apiUrl);
    }

    getProblemById(id: number): Observable<Problem> {
        return this.http.get<Problem>(`${this.apiUrl}/${id}`);
    }

    getTopics(): Observable<Topic[]> {
        return this.http.get<Topic[]>(`${this.apiUrl}/topics`);
    }
}
