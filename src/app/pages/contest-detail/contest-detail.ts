import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContestService } from '../../services/contest.service';
import { ProblemService } from '../../services/problem.service';
import { ContestDto, ContestProblemDto, ContestMemberDto, ContestProgressDto } from '../../models/contest.models';
import { ProblemDto } from '../../models/problem.models';
import { forkJoin, map, Observable, of, switchMap, catchError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

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
    protected readonly progress = signal<ContestProgressDto | null>(null);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly isJoining = signal<boolean>(false);
    protected readonly hasJoined = signal<boolean>(false);
    protected readonly activeTab = signal<'overview' | 'contesting' | 'scoreboard'>('overview');
    protected readonly timeUntilStart = signal<string>('');
    protected readonly timeUntilEnd = signal<string>('');
    protected readonly timeUntilFreeze = signal<string>('');
    protected readonly isFreezeTime = signal<boolean>(false);
    private timerInterval: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private contestService: ContestService,
        private problemService: ProblemService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            const tab = params.get('tab') as 'overview' | 'contesting' | 'scoreboard';

            if (id && this.contest()?.id !== +id) {
                this.loadContestData(+id);
            } else if (!id) {
                this.router.navigate(['/contests']);
            }

            if (tab) {
                this.activeTab.set(tab);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    private loadContestData(id: number): void {
        this.isLoading.set(true);

        const requests: any = {
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
        };

        if (this.authService.isLoggedIn()) {
            requests.hasJoined = this.contestService.hasJoinedContest(id).pipe(
                catchError(() => of({ hasJoined: false }))
            );
            requests.progress = this.contestService.getUserProgress(id).pipe(
                catchError(() => of(null))
            );
        }

        forkJoin(requests).subscribe({
            next: (data: any) => {
                this.contest.set(data.contest);
                this.problems.set(data.problems.sort((a: any, b: any) => a.ordinal - b.ordinal));
                this.members.set(data.members);
                if (data.hasJoined) {
                    this.hasJoined.set(data.hasJoined.hasJoined);
                }
                if (data.progress) {
                    this.progress.set(data.progress);
                }
                this.isLoading.set(false);
                this.startTimer();
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
        this.router.navigate(['/contests', contest.id, 'problems', problemId]);
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

    private formatDuration(diff: number): string {
        if (diff <= 0) return '';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        
        if (days > 0) {
            return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
        } else {
            return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
        }
    }

    private startTimer(): void {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const c = this.contest();
            if (!c) return;
            
            const now = new Date().getTime();
            const start = new Date(c.start_time).getTime();
            const end = new Date(c.end_time).getTime();
            const freeze = c.freeze_time ? new Date(c.freeze_time).getTime() : null;
            
            if (now < start) {
                this.timeUntilStart.set(this.formatDuration(start - now));
                this.timeUntilEnd.set('');
                this.timeUntilFreeze.set('');
                this.isFreezeTime.set(false);
            } else if (now < end) {
                this.timeUntilStart.set('');
                this.timeUntilEnd.set(this.formatDuration(end - now));
                
                if (freeze) {
                    if (now < freeze) {
                        this.timeUntilFreeze.set(this.formatDuration(freeze - now));
                        this.isFreezeTime.set(false);
                    } else {
                        this.timeUntilFreeze.set('');
                        this.isFreezeTime.set(true);
                    }
                } else {
                    this.timeUntilFreeze.set('');
                    this.isFreezeTime.set(false);
                }
            } else {
                this.timeUntilStart.set('');
                this.timeUntilEnd.set('');
                this.timeUntilFreeze.set('');
                this.isFreezeTime.set(false);
                clearInterval(this.timerInterval);
            }
        }, 1000);
    }
}
