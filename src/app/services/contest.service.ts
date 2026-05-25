import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
    ContestDto,
    ContestProblemDto,
    ContestMemberDto,
    CreateContestRequest,
    AddContestProblemRequest,
    UpdateContestProblemsRequest,
    UpdateContestRequest,
    ContestProgressDto,
    ScoreboardDto
} from '../models/contest.models';

@Injectable({
    providedIn: 'root'
})
export class ContestService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1/contests`;

    getAllContests(): Observable<ContestDto[]> {
        return this.http.get<ContestDto[]>(this.baseUrl);
    }

    getContestById(id: number): Observable<ContestDto> {
        return this.http.get<ContestDto>(`${this.baseUrl}/${id}`);
    }

    createContest(request: CreateContestRequest): Observable<ContestDto> {
        return this.http.post<ContestDto>(this.baseUrl, request);
    }

    updateContest(id: number, request: UpdateContestRequest): Observable<ContestDto> {
        return this.http.put<ContestDto>(`${this.baseUrl}/${id}`, request);
    }

    getContestProblems(id: number): Observable<ContestProblemDto[]> {
        return this.http.get<ContestProblemDto[]>(`${this.baseUrl}/${id}/problems`);
    }

    addProblemToContest(contestId: number, request: AddContestProblemRequest): Observable<ContestProblemDto> {
        return this.http.post<ContestProblemDto>(`${this.baseUrl}/${contestId}/problems`, request);
    }

    updateContestProblems(contestId: number, request: UpdateContestProblemsRequest): Observable<ContestProblemDto[]> {
        return this.http.put<ContestProblemDto[]>(`${this.baseUrl}/${contestId}/problems`, request);
    }

    getContestMembers(id: number): Observable<ContestMemberDto[]> {
        return this.http.get<ContestMemberDto[]>(`${this.baseUrl}/${id}/members`);
    }

    joinContest(id: number): Observable<ContestMemberDto> {
        return this.http.post<ContestMemberDto>(`${this.baseUrl}/${id}/join`, {});
    }

    hasJoinedContest(id: number): Observable<{hasJoined: boolean}> {
        return this.http.get<{hasJoined: boolean}>(`${this.baseUrl}/${id}/has-joined`);
    }

    getUserProgress(id: number): Observable<ContestProgressDto> {
        return this.http.get<ContestProgressDto>(`${this.baseUrl}/${id}/progress`);
    }

    getScoreboard(id: number): Observable<ScoreboardDto> {
        return this.http.get<ScoreboardDto>(`${this.baseUrl}/${id}/scoreboard`);
    }
}
