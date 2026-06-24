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
});
