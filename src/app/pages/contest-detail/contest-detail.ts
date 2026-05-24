import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContestService } from '../../services/contest.service';
import { ProblemService } from '../../services/problem.service';
import { ContestDto, ContestProblemDto, ContestMemberDto } from '../../models/contest.models';
import { ProblemDto } from '../../models/problem.models';
import { forkJoin, map, Observable, of, switchMap, catchError } from 'rxjs';

interface ContestProblemWithDetails extends ContestProblemDto {
    problemDetails?: ProblemDto;
}

@Component({
    selector: 'app-contest-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contest-detail.html',
    styleUrl: './contest-detail.css'
})
export class ContestDetail implements OnInit {
    protected readonly contest = signal<ContestDto | null>(null);
    protected readonly problems = signal<ContestProblemWithDetails[]>([]);
    protected readonly members = signal<ContestMemberDto[]>([]);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly isJoining = signal<boolean>(false);
    protected readonly hasJoined = signal<boolean>(false);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private contestService: ContestService,
        private problemService: ProblemService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadContestData(+id);
        } else {
            this.router.navigate(['/contests']);
        }
    }

    private loadContestData(id: number): void {
        this.isLoading.set(true);

        forkJoin({
            contest: this.contestService.getContestById(id),
            problems: this.contestService.getContestProblems(id).pipe(
                switchMap(contestProblems => {
                    if (contestProblems.length === 0) return of([]);
                    const problemRequests = contestProblems.map(cp => 
                        this.problemService.getProblemById(cp.problem_id).pipe(
                            map(p => ({ ...cp, problemDetails: p })),
                            catchError(() => of(cp))
                        )
                    );
                    return forkJoin(problemRequests);
                })
            ),
            members: this.contestService.getContestMembers(id).pipe(
                catchError(() => of([]))
            )
        }).subscribe({
            next: (data) => {
                this.contest.set(data.contest);
                this.problems.set(data.problems.sort((a, b) => a.ordinal - b.ordinal));
                this.members.set(data.members);
                // Currently, we don't have a direct way to check if current user is in members list without User context.
                // Assuming hasJoined logic based on some user context or letting API return 400.
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading contest:', error);
                this.isLoading.set(false);
                this.router.navigate(['/contests']);
            }
        });
    }

    protected joinContest(): void {
        const contest = this.contest();
        if (!contest) return;

        this.isJoining.set(true);
        this.contestService.joinContest(contest.id).subscribe({
            next: (member) => {
                this.hasJoined.set(true);
                this.members.update(m => [...m, member]);
                this.isJoining.set(false);
            },
            error: (error) => {
                console.error('Error joining contest:', error);
                if (error.status === 400) {
                    this.hasJoined.set(true);
                }
                this.isJoining.set(false);
            }
        });
    }

    protected navigateToProblem(problemId: number): void {
        const contest = this.contest();
        if (!contest) return;
        this.router.navigate(['/problems', problemId], { queryParams: { contestId: contest.id } });
    }

    protected getStatus(): string {
        const c = this.contest();
        if (!c) return '';
        
        const now = new Date();
        const start = new Date(c.start_time);
        const end = new Date(c.end_time);

        if (now < start) return 'Upcoming';
        if (now > end) return 'Ended';
        return 'Running';
    }

    protected getStatusClass(): string {
        const status = this.getStatus();
        switch (status) {
            case 'Upcoming': return 'status-upcoming';
            case 'Running': return 'status-running';
            case 'Ended': return 'status-ended';
            default: return '';
        }
    }

    protected formatDate(dateString: string | null | undefined): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
