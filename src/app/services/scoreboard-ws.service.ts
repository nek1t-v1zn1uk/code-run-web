import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ScoreboardDto } from '../models/contest.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScoreboardWebSocketService implements OnDestroy {
  private rxStomp: RxStomp;
  private currentContestId: number | null = null;
  private scoreboardSubject = new BehaviorSubject<ScoreboardDto | null>(null);
  private subscription: Subscription | null = null;

  public scoreboard$ = this.scoreboardSubject.asObservable();

  constructor() {
    this.rxStomp = new RxStomp();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws-coderun`;
    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    this.rxStomp.activate();
  }

  public subscribeToContestScoreboard(contestId: number): void {
    if (this.currentContestId === contestId) {
      return;
    }
    this.unsubscribe();
    this.currentContestId = contestId;
    
    this.subscription = this.rxStomp.watch(`/topic/contests/${contestId}/scoreboard`).subscribe((message) => {
      try {
        const scoreboard = JSON.parse(message.body) as ScoreboardDto;
        this.scoreboardSubject.next(scoreboard);
      } catch (e) {
        console.error('Failed to parse scoreboard update', e);
      }
    });
  }

  public setInitialScoreboard(scoreboard: ScoreboardDto): void {
    this.scoreboardSubject.next(scoreboard);
  }

  public unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.currentContestId = null;
  }

  ngOnDestroy(): void {
    this.unsubscribe();
    this.rxStomp.deactivate();
  }
}
