import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TestDto, UpdateTestListRequest } from '../models/test.models';

@Injectable({
    providedIn: 'root'
})
export class TestService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1`;

    getProblemTests(problemId: number): Observable<TestDto[]> {
        return this.http.get<TestDto[]>(`${this.baseUrl}/problems/${problemId}/tests`);
    }

    getTestById(testId: number): Observable<TestDto> {
        return this.http.get<TestDto>(`${this.baseUrl}/tests/${testId}`);
    }

    updateTestList(problemId: number, request: UpdateTestListRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/problems/${problemId}/tests`, request);
    }
}
