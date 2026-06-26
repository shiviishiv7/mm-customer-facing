import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MeetingService, UpcomingMeeting } from './meeting.service';
import { AuthService } from './auth.service';
import { environment } from '@environments/environment';

const BASE = `${environment.apiUrl}/api/v1/meetings`;

function stubMeeting(overrides: Partial<UpcomingMeeting> = {}): UpcomingMeeting {
  return {
    id: '1', matchId: '99', roundNumber: 1,
    scheduledAt: '2026-07-01T10:00:00', durationMinutes: 30,
    status: 'SCHEDULED', meetingType: 'SCHEDULED',
    peerFirstName: 'Bob', peerLastName: 'Smith', peerCognitoSub: 'sub-b',
    ...overrides,
  };
}

describe('MeetingService', () => {
  let service: MeetingService;
  let http: HttpTestingController;
  const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);
  authSpy.sub = 'sub-a';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MeetingService,
        { provide: AuthService, useValue: authSpy },
      ],
    });
    service  = TestBed.inject(MeetingService);
    http     = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // TC-M01
  it('TC-M01: getUpcoming calls /api/v1/meetings/user/{sub}/upcoming', () => {
    service.getUpcoming().subscribe();
    const req = http.expectOne(`${BASE}/user/sub-a/upcoming`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  // TC-M02
  it('TC-M02: getUpcoming uses authenticated user sub from AuthService', () => {
    service.getUpcoming().subscribe();
    const req = http.expectOne(r => r.url.includes('sub-a'));
    expect(req.request.url).toContain('sub-a');
    req.flush({ data: [] });
  });

  // TC-M03
  it('TC-M03: getUpcoming returns upcoming meetings array from response', () => {
    const meetings = [stubMeeting()];
    let result: any;
    service.getUpcoming().subscribe(r => result = r);
    http.expectOne(`${BASE}/user/sub-a/upcoming`).flush({ data: meetings });
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe('1');
  });

  // TC-M04
  it('TC-M04: getUpcoming meeting has correct peer name fields', () => {
    let result: any;
    service.getUpcoming().subscribe(r => result = r);
    http.expectOne(`${BASE}/user/sub-a/upcoming`).flush({ data: [stubMeeting()] });
    const m: UpcomingMeeting = result.data[0];
    expect(m.peerFirstName).toBe('Bob');
    expect(m.peerCognitoSub).toBe('sub-b');
  });

  // TC-M05
  it('TC-M05: markCompleted calls PATCH /api/v1/meetings/{id}/cancel', () => {
    service.markCompleted('42').subscribe();
    const req = http.expectOne(`${BASE}/42/cancel`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  // TC-M06
  it('TC-M06: getUpcoming with empty list returns empty array', () => {
    let result: any;
    service.getUpcoming().subscribe(r => result = r);
    http.expectOne(`${BASE}/user/sub-a/upcoming`).flush({ data: [] });
    expect(result.data).toEqual([]);
  });

  // ── submitFeedback ─────────────────────────────────────────────────────────

  // TC-M07
  it('TC-M07: submitFeedback calls POST /api/v1/meetings/{id}/feedback', () => {
    service.submitFeedback('10', 'YES').subscribe();
    const req = http.expectOne(`${BASE}/10/feedback`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  // TC-M08
  it('TC-M08: submitFeedback sends response=YES in body', () => {
    service.submitFeedback('10', 'YES').subscribe();
    const req = http.expectOne(`${BASE}/10/feedback`);
    expect(req.request.body.response).toBe('YES');
    req.flush({});
  });

  // TC-M09
  it('TC-M09: submitFeedback sends response=NO in body', () => {
    service.submitFeedback('10', 'NO').subscribe();
    const req = http.expectOne(`${BASE}/10/feedback`);
    expect(req.request.body.response).toBe('NO');
    req.flush({});
  });

  // TC-M10
  it('TC-M10: submitFeedback includes optional notes when provided', () => {
    service.submitFeedback('10', 'YES', 'Great conversation').subscribe();
    const req = http.expectOne(`${BASE}/10/feedback`);
    expect(req.request.body.notes).toBe('Great conversation');
    req.flush({});
  });

  // TC-M11
  it('TC-M11: submitFeedback omits notes field when not provided', () => {
    service.submitFeedback('10', 'NO').subscribe();
    const req = http.expectOne(`${BASE}/10/feedback`);
    expect(req.request.body.notes).toBeUndefined();
    req.flush({});
  });

  // ── requestNextMatch ───────────────────────────────────────────────────────

  // TC-M12
  it('TC-M12: requestNextMatch calls POST /api/v1/matches/next', () => {
    service.requestNextMatch().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/api/v1/matches/next`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  // TC-M13
  it('TC-M13: requestNextMatch sends an empty body', () => {
    service.requestNextMatch().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/api/v1/matches/next`);
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  // TC-M14
  it('TC-M14: requestNextMatch returns the response from the server', () => {
    let result: any;
    service.requestNextMatch().subscribe(r => result = r);
    http.expectOne(`${environment.apiUrl}/api/v1/matches/next`)
      .flush({ statusCode: 200, message: 'Connecting now', data: null });
    expect(result.statusCode).toBe(200);
    expect(result.message).toContain('Connecting');
  });
});
