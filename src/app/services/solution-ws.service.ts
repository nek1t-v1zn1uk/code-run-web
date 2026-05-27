import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { SolutionDto } from '../models/solution.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolutionWebSocketService implements OnDestroy {
  private rxStomp: RxStomp;
  private currentSolutionId: number | null = null;
  private solutionSubject = new BehaviorSubject<SolutionDto | null>(null);
  private subscription: Subscription | null = null;

  public solution$ = this.solutionSubject.asObservable();

  constructor() {
    this.rxStomp = new RxStomp();
    const serverUrl = environment.serverUrl || window.location.origin;
    const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws-coderun';
    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    this.rxStomp.activate();
  }

  public subscribeToSolution(solutionId: number): void {
    if (this.currentSolutionId === solutionId) {
      return;
    }
    this.unsubscribe();
    this.currentSolutionId = solutionId;
    
    this.subscription = this.rxStomp.watch(`/topic/solutions/${solutionId}`).subscribe((message) => {
      try {
        const solution = JSON.parse(message.body) as SolutionDto;
        this.solutionSubject.next(solution);
      } catch (e) {
        console.error('Failed to parse solution update', e);
      }
    });
  }

  public unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.currentSolutionId = null;
  }

  ngOnDestroy(): void {
    this.unsubscribe();
    this.rxStomp.deactivate();
  }
}
