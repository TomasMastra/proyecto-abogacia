import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, fromEvent, merge, interval, Subscription } from 'rxjs';
import { switchMap, catchError, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';

export type ConectionState = 'online' | 'offline' | 'server-down';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService implements OnDestroy {

  private readonly PING_URL    = `${environment.apiBase}/health`;
  private readonly PING_EVERY  = 15_000; // ms

  private state$ = new BehaviorSubject<ConectionState>('online');
  readonly status$ = this.state$.asObservable().pipe(distinctUntilChanged());

  private subs = new Subscription();

  constructor(private http: HttpClient) {
    this.init();
  }

  private init(): void {
    // 1. Reaccionar a los eventos nativos del browser
    const offline$ = fromEvent(window, 'offline');
    const online$  = fromEvent(window, 'online');

    this.subs.add(
      offline$.subscribe(() => this.state$.next('offline'))
    );

    this.subs.add(
      online$.subscribe(() => this.pingServer())
    );

    // 2. Ping periódico al servidor
    this.subs.add(
      interval(this.PING_EVERY).subscribe(() => this.pingServer())
    );

    // 3. Ping inicial
    this.pingServer();
  }

  pingServer(): void {
    if (!navigator.onLine) {
      this.state$.next('offline');
      return;
    }

    this.http.get(this.PING_URL, { responseType: 'text' })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.state$.next(res !== null ? 'online' : 'server-down');
      });
  }

  get currentState(): ConectionState {
    return this.state$.getValue();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}