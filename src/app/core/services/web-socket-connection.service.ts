import {inject, Injectable, OnDestroy} from '@angular/core';
import { Client, StompSubscription, IMessage, StompConfig } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import SockJS from 'sockjs-client';
import {environment} from '@environments/environment';
import {AuthService} from '@core/services/auth.service';

export enum ConnectionStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}


@Injectable({
  providedIn: 'root'
})
export class WebSocketConnectionService {
  auth = inject(AuthService)

  constructor() {
    this.initClient()
  }

  private client!: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();

  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );

  /** Emits the current connection status */
  public status$: Observable<ConnectionStatus> =
    this.connectionStatus$.asObservable();

  /** Emits true when connected */
  public isConnected$: Observable<boolean> = new Observable((observer) => {
    this.connectionStatus$.subscribe((status) => {
      observer.next(status === ConnectionStatus.CONNECTED);
    });
  });

  private brokerURL = environment.wsUrl;


  // ─── Initialization ────────────────────────────────────────────────────────

  public initClient(): void {
    this.client = new Client({
      // Use SockJS factory — remove this and use brokerURL for plain WebSocket
      webSocketFactory: () => new SockJS(`${this.brokerURL}?token=${this.auth.getToken()}`),

      // Reconnect every 5 seconds on disconnect
      reconnectDelay: 5000,

      // Heartbeat every 10 seconds
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: (msg: string) => {
        if (!environment.production) {
          console.debug('[STOMP]', msg);
        }
      },

      onConnect: () => {
        console.log('[STOMP] Connected');
        this.connectionStatus$.next(ConnectionStatus.CONNECTED);
      },

      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
        this.connectionStatus$.next(ConnectionStatus.DISCONNECTED);
      },

      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
        this.connectionStatus$.next(ConnectionStatus.ERROR);
      },

      onWebSocketError: (event) => {
        console.error('[STOMP] WebSocket Error:', event);
        this.connectionStatus$.next(ConnectionStatus.ERROR);
      },
    });
  }

  // ─── Connect / Disconnect ──────────────────────────────────────────────────

  /** Connect to the STOMP broker */
  connect(): void {
    if (this.client.active) {
      console.warn('[STOMP] Already connected or connecting.');
      return;
    }
    this.connectionStatus$.next(ConnectionStatus.CONNECTING);
    this.client.activate();
  }

  /** Gracefully disconnect and clear all subscriptions */
  disconnect(): void {
    this.unsubscribeAll();
    this.client.deactivate();
    this.connectionStatus$.next(ConnectionStatus.DISCONNECTED);
  }

  // ─── Subscribe ─────────────────────────────────────────────────────────────

  /**
   * Subscribe to a STOMP topic and get an Observable of parsed messages.
   * Waits for connection before subscribing.
   *
   * @param topic  e.g. "/topic/matches"
   * @returns Observable that emits each incoming message body (parsed JSON)
   *
   * @example
   * this.stompService.subscribe<Match[]>('/topic/matches').subscribe(matches => {
   *   this.matches = matches;
   * });
   */
  receiveData<T = unknown>(topic: string): Observable<T> {
    const messages$ = new Subject<T>();

    // Wait until connected, then subscribe
    this.connectionStatus$
      .pipe(
        filter((status) => status === ConnectionStatus.CONNECTED),
        take(1)
      )
      .subscribe(() => {
        if (this.subscriptions.has(topic)) {
          console.warn(`[STOMP] Already subscribed to ${topic}`);
          return;
        }

        const subscription = this.client.subscribe(
          topic,
          (message: IMessage) => {
            try {
              const parsed: T = JSON.parse(message.body);
              messages$.next(parsed);
            } catch {
              // If body is not JSON, emit as-is
              messages$.next(message.body as unknown as T);
            }
          }
        );

        this.subscriptions.set(topic, subscription);
        console.log(`[STOMP] Subscribed to ${topic}`);
      });

    return messages$.asObservable();
  }

  /**
   * Unsubscribe from a specific topic.
   * @param topic  e.g. "/topic/matches"
   */
  unsubscribe(topic: string): void {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`[STOMP] Unsubscribed from ${topic}`);
    }
  }

  /** Unsubscribe from all active subscriptions */
  unsubscribeAll(): void {
    this.subscriptions.forEach((sub, topic) => {
      sub.unsubscribe();
      console.log(`[STOMP] Unsubscribed from ${topic}`);
    });
    this.subscriptions.clear();
  }

  // ─── Publish ───────────────────────────────────────────────────────────────

  /**
   * Send a message to a destination.
   * Waits for connection before sending.
   *
   * @param destination  e.g. "/app/match"
   * @param body         Object to be JSON-serialized, or a plain string
   * @param headers      Optional STOMP headers
   *
   * @example
   * this.stompService.publish('/app/match', { userId: 1, action: 'find' });
   */
  publish<T = unknown>(
    destination: string,
    body: T,
    headers: Record<string, string> = {}
  ): void {
    const send = () => {
      this.client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers,
      });
    };

    if (this.connectionStatus$.getValue() === ConnectionStatus.CONNECTED) {
      send();
    } else {
      // Queue the message until connected
      this.connectionStatus$
        .pipe(
          filter((status) => status === ConnectionStatus.CONNECTED),
          take(1)
        )
        .subscribe(() => send());
    }
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  /** Returns true if currently connected */
  get isConnected(): boolean {
    return this.connectionStatus$.getValue() === ConnectionStatus.CONNECTED;
  }

  /** Returns list of currently active topic subscriptions */
  get activeTopics(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.disconnect();
  }
}
