import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CodeExecutionRequest {
    code: string;
    input: string;
    language: 'c' | 'cpp' | 'python' | 'java' | 'kotlin';
}

export interface CodeExecutionResponse {
    status: string;
    exitCode: number;
    output: string;
    time: number;
    memory: number;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CodeExecutionService {
    private readonly apiUrl = `${environment.apiUrl}/v1/code-execution`;

    constructor(private http: HttpClient) { }

    executeCode(request: CodeExecutionRequest): Observable<CodeExecutionResponse> {
        return this.http.post<CodeExecutionResponse>(this.apiUrl, request);
    }
}
