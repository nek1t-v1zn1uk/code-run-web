import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
    CreateScriptCheckerRequest, 
    ScriptCheckerDto, 
    UpdateScriptCheckerRequest 
} from '../models/script-checker.models';

@Injectable({
    providedIn: 'root'
})
export class ScriptCheckerService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1/script-checkers`;

    getScriptChecker(id: number): Observable<ScriptCheckerDto> {
        return this.http.get<ScriptCheckerDto>(`${this.baseUrl}/${id}`);
    }

    createScriptChecker(request: CreateScriptCheckerRequest): Observable<ScriptCheckerDto> {
        return this.http.post<ScriptCheckerDto>(this.baseUrl, request);
    }

    updateScriptChecker(id: number, request: UpdateScriptCheckerRequest): Observable<ScriptCheckerDto> {
        return this.http.patch<ScriptCheckerDto>(`${this.baseUrl}/${id}`, request);
    }

    deleteScriptChecker(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
