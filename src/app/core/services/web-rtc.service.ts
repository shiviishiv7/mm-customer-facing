import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject, Subscription } from 'rxjs';
import { WebSocketConnectionService } from './web-socket-connection.service';
import { AuthService } from './auth.service';
import { MemeStreamService } from './meme/meme-stream.service';
import { environment } from '@environments/environment';

export interface PoolUser {
  cognitoSub: string;
  firstName: string;
  lastName: string;
  industry: string;
}

export interface WebRTCSignal {
  type: 'POOL_LIST' | 'CONNECTION_REQUEST' | 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'PEER_LEFT';
  fromUserId: string;
  toUserId: string;
  payload: string;  // SDP string or ICE candidate JSON
}

@Injectable({ providedIn: 'root' })
export class WebRtcService implements OnDestroy {

  private stomp        = inject(WebSocketConnectionService);
  private auth         = inject(AuthService);
  private memeStream = inject(MemeStreamService);

  // ── State ──────────────────────────────────────────────────────────────────
  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  private pendingIceCandidates: RTCIceCandidateInit[] = []; // buffer ICE candidates until peerConnection is ready

  private _poolUsers$    = new BehaviorSubject<PoolUser[]>([]);
  private _remoteStream$ = new ReplaySubject<MediaStream>(1);
  private _localStream$  = new ReplaySubject<MediaStream>(1);  // emits when local camera is ready
  private _callStatus$   = new BehaviorSubject<string>('idle');
  private _dataChannel$  = new Subject<MessageEvent>();   // emits raw DataChannel messages

  public poolUsers$    = this._poolUsers$.asObservable();
  public remoteStream$ = this._remoteStream$.asObservable();
  public localStream$  = this._localStream$.asObservable();
  public callStatus$   = this._callStatus$.asObservable();
  public dataChannel$  = this._dataChannel$.asObservable(); // ChatService subscribes here

  private currentPeerSub: string | null = null;
  private signalSub!: Subscription;
  private dataChannel: RTCDataChannel | null = null;

  private readonly METERED_API_URL = `https://shallweconnect.metered.live/api/v1/turn/credentials?apiKey=${environment.meteredApiKey}`;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Call this when the user opens the find-match screen.
   * Connects WebSocket, joins pool, and listens for all signals.
   */
  joinPool(): void {
    // Step 1: subscribe to all incoming signals first
    this.listenForSignals();

    // Step 2: connect WebSocket
    this.stomp.connect();

    // Step 3: tell server we joined — server sends back pool list
    this.stomp.publish('/app/webrtc.join', {});
  }

  /** Call when leaving the screen or ending call */
  leavePool(): void {
    this.stomp.publish('/app/webrtc.leave', {
      toUserId: this.currentPeerSub  // notify peer if in a call
    });
    this.cleanupPeerConnection();
    this.signalSub?.unsubscribe();
    this.stomp.disconnect();
    this._callStatus$.next('idle');
  }

  // ── Scheduled match entry points ───────────────────────────────────────────

  /**
   * Connect WebSocket and start listening for WebRTC signals
   * without joining the instant-match pool.
   * Called by ScheduledMatchService when the scheduled-match screen opens.
   */
  connectForScheduledMatch(): void {
    this.listenForSignals();
    this.stomp.connect();
  }

  /** Disconnect without touching the pool */
  disconnectScheduledMatch(): void {
    if (this.currentPeerSub) {
      this.stomp.publish('/app/webrtc/signal', {
        type: 'PEER_LEFT',
        fromUserId: '',
        toUserId: this.currentPeerSub,
        payload: ''
      });
    }
    this.cleanupPeerConnection();
    this.signalSub?.unsubscribe();
    this.stomp.disconnect();
    this._callStatus$.next('idle');
  }

  /** Called when server says this client should initiate the WebRTC handshake */
  async initiateScheduledCall(peerSub: string): Promise<void> {
    this._callStatus$.next('calling');
    await this.createAndSendOffer(peerSub);
  }

  // ── Step 2: Caller selects a user and sends connection request ─────────────

  requestConnection(targetSub: string): void {
    this.currentPeerSub = targetSub;
    this._callStatus$.next('calling');

    this.stomp.publish('/app/webrtc.request', {
      toUserId: targetSub,
      payload: ''
    });
    console.log('[WebRTC] Connection request sent to:', targetSub);
  }

  // ── Step 3: Caller creates and sends SDP Offer ────────────────────────────

  async createAndSendOffer(targetSub: string): Promise<void> {
    this.currentPeerSub = targetSub;
    await this.setupPeerConnection(targetSub, true);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.stomp.publish('/app/webrtc.offer', {
      toUserId: targetSub,
      payload: JSON.stringify(offer)
    });
    console.log('[WebRTC] SDP Offer sent to:', targetSub);
  }

  // ── Step 4: Callee receives offer, creates and sends SDP Answer ───────────

  async handleOfferAndSendAnswer(signal: WebRTCSignal): Promise<void> {
    this.currentPeerSub = signal.fromUserId;
    await this.setupPeerConnection(signal.fromUserId);

    const offer = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
    await this.peerConnection.setRemoteDescription(offer);
    await this.flushPendingIceCandidates(); // apply any buffered ICE candidates

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.stomp.publish('/app/webrtc.answer', {
      toUserId: signal.fromUserId,
      payload: JSON.stringify(answer)
    });
    console.log('[WebRTC] SDP Answer sent to:', signal.fromUserId);
  }

  // ── Step 5: Caller receives answer ────────────────────────────────────────

  async handleAnswer(signal: WebRTCSignal): Promise<void> {
    const answer = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
    await this.peerConnection.setRemoteDescription(answer);
    await this.flushPendingIceCandidates(); // apply any buffered ICE candidates
    console.log('[WebRTC] Remote description (answer) set');
  }

  // ── Step 5: ICE Candidate Exchange (both sides) ───────────────────────────

  async handleIceCandidate(signal: WebRTCSignal): Promise<void> {
    const candidate = JSON.parse(signal.payload) as RTCIceCandidateInit;

    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      // peerConnection not ready yet — buffer and apply later
      console.log('[WebRTC] Buffering ICE candidate — peerConnection not ready yet');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    await this.peerConnection.addIceCandidate(candidate);
    console.log('[WebRTC] ICE candidate added from:', signal.fromUserId);
  }

  /** Apply all buffered ICE candidates after remote description is set */
  private async flushPendingIceCandidates(): Promise<void> {
    console.log(`[WebRTC] Flushing ${this.pendingIceCandidates.length} buffered ICE candidates`);
    for (const candidate of this.pendingIceCandidates) {
      await this.peerConnection.addIceCandidate(candidate);
    }
    this.pendingIceCandidates = [];
  }

  // ── Internal: Listen for all incoming signals ─────────────────────────────

  listenForSignals(): void {
    this.signalSub = this.stomp
      .receiveData<any>('/user/queue/webrtc')
      .subscribe(async (data) => {

        // Pool list — just got the list of available users from server
        if (Array.isArray(data)) {
          this._poolUsers$.next(data as PoolUser[]);
          console.log('[WebRTC] Pool list received:', data);
          return;
        }

        const signal = data as WebRTCSignal;
        console.log('[WebRTC] Signal received:', signal.type, 'from:', signal.fromUserId);

        switch (signal.type) {

          // Someone wants to connect to me — I accept and create an offer (caller creates offer)
          case 'CONNECTION_REQUEST':
            console.log('[WebRTC] Connection request from:', signal.fromUserId);
            this._callStatus$.next('calling');
            // Caller now creates offer after getting callee's acceptance
            // In a real app you'd show a UI "Accept / Reject" button here
            // For now, auto-accept: caller creates offer
            await this.createAndSendOffer(signal.fromUserId);
            break;

          // I am the callee — received the SDP offer, create answer
          case 'OFFER':
            await this.handleOfferAndSendAnswer(signal);
            this._callStatus$.next('in-call');
            break;

          // I am the caller — received the SDP answer
          case 'ANSWER':
            await this.handleAnswer(signal);
            this._callStatus$.next('in-call');
            break;

          // ICE candidate from other peer
          case 'ICE_CANDIDATE':
            await this.handleIceCandidate(signal);
            break;

          // Other peer left or ended call
          case 'PEER_LEFT':
            console.log('[WebRTC] Peer left:', signal.fromUserId);
            this.cleanupPeerConnection();
            this._callStatus$.next('ended');
            break;
        }
      });
  }

  /**
   * Starts the local camera/mic and emits to localStream$ without
   * setting up a peer connection. Used in the scheduled match waiting room
   * so the user can see themselves while waiting for the peer to join.
   */
  async startLocalCamera(): Promise<void> {
    if (this.localStream) return; // already running
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const filtered = this.memeStream.start(this.localStream);
      this._localStream$.next(filtered);
      console.log('[WebRTC] Local camera started (waiting room, meme pipeline)');
    } catch (err) {
      console.error('[WebRTC] Failed to start local camera:', err);
    }
  }

  // ── Internal: RTCPeerConnection setup ────────────────────────────────────

  private async setupPeerConnection(targetSub: string, isCaller = false): Promise<void> {
    // Capture raw camera/mic
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Run the raw stream through MemeStreamService → canvas pipeline.
    // Draws either raw camera or a meme image onto a canvas at 30fps.
    const filteredStream = this.memeStream.start(this.localStream);
    this._localStream$.next(filteredStream);
    console.log('[WebRTC] Local stream ready (meme pipeline)');

    // Fetch fresh ICE servers (STUN + TURN) from Metered.ca API
    const iceServers = await this.fetchIceServers();
    this.peerConnection = new RTCPeerConnection({ iceServers });

    // Add filtered tracks to peer connection (peer receives filtered video)
    filteredStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, filteredStream);
    });

    // ── Data channel for in-call chat ─────────────────────────────────────
    // Only the caller creates the channel; the callee receives it via ondatachannel.
    // Both sides setting up createDataChannel was causing duplicate messages.
    if (isCaller) {
      this.dataChannel = this.peerConnection.createDataChannel('chat', { ordered: true });
      this.wireDataChannel(this.dataChannel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        console.log('[WebRTC] DataChannel received from peer');
        this.dataChannel = event.channel;
        this.wireDataChannel(this.dataChannel);
      };
    }

    // When we receive remote video/audio tracks — emit them
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received');
      this._remoteStream$.next(event.streams[0]);
    };

    // When ICE candidates are generated — send them to the other peer via server
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.stomp.publish('/app/webrtc.ice', {
          toUserId: targetSub,
          payload: JSON.stringify(event.candidate)
        });
        console.log('[WebRTC] ICE candidate sent to:', targetSub);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        this._callStatus$.next('in-call');
      }
    };
  }

  /** Subscribe to DataChannel events and forward messages to dataChannel$. */
  private wireDataChannel(channel: RTCDataChannel): void {
    channel.onopen    = () => console.log('[WebRTC] DataChannel open');
    channel.onclose   = () => console.log('[WebRTC] DataChannel closed');
    channel.onmessage = (event) => this._dataChannel$.next(event);
    channel.onerror   = (err)   => console.error('[WebRTC] DataChannel error', err);
  }

  /** Send a chat message over the WebRTC data channel. */
  sendChatMessage(payload: string): boolean {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(payload);
      return true;
    }
    console.warn('[WebRTC] DataChannel not open — message dropped');
    return false;
  }

  /**
   * Fetches fresh STUN + TURN credentials from Metered.ca.
   * Falls back to Google STUN if the API call fails.
   */
  private async fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await fetch(this.METERED_API_URL);
      const iceServers: RTCIceServer[] = await response.json();
      console.log('[WebRTC] ICE servers fetched:', iceServers.length);
      return iceServers;
    } catch (err) {
      console.warn('[WebRTC] Failed to fetch ICE servers, falling back to Google STUN', err);
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }

  private cleanupPeerConnection(): void {
    this.memeStream.stop();
    this.dataChannel?.close();
    this.dataChannel = null;
    this.peerConnection?.close();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.pendingIceCandidates = [];
    // Reset streams for next call
    (this as any)._remoteStream$ = new ReplaySubject<MediaStream>(1);
    (this as any)._localStream$  = new ReplaySubject<MediaStream>(1);
    this.remoteStream$ = this._remoteStream$.asObservable();
    this.localStream$  = this._localStream$.asObservable();
    this.currentPeerSub = null;
  }

  /** Returns the local media stream so the component can display it */
  getLocalStream(): MediaStream | null {
    return this.localStream ?? null;
  }

  ngOnDestroy(): void {
    this.leavePool();
  }
}
