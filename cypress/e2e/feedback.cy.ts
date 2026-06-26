/**
 * E2E: Post-call feedback and next-match flow
 *
 * Tests the scheduled-match page: the YES/NO feedback form,
 * next-match request, and back-to-list navigation.
 */

const API = 'http://localhost:8080';

const UPCOMING_BODY = {
  statusCode: 200,
  data: [
    {
      id: '10', matchId: '5', roundNumber: 1,
      scheduledAt: '2026-12-01T10:00:00',
      durationMinutes: 30, status: 'SCHEDULED', meetingType: 'SCHEDULED',
      peerFirstName: 'Priya', peerLastName: 'Sharma', peerCognitoSub: 'sub-priya',
    },
  ],
};

describe('Post-call feedback & next-match flow', () => {

  beforeEach(() => {
    cy.stubWebSocket();
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`,
      { statusCode: 200, body: UPCOMING_BODY }).as('upcoming');
    cy.intercept('POST', `${API}/api/v1/meetings/*/feedback`,
      { statusCode: 200, body: { statusCode: 200, message: 'Feedback submitted' } }).as('feedback');
    cy.intercept('POST', `${API}/api/v1/matches/next`,
      { statusCode: 200, body: { statusCode: 200, message: 'Connecting now', data: null } }).as('nextMatch');
    cy.login();
    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');
  });

  // ── FB-E2E-01: idle state shows upcoming meetings ────────────────────────

  it('FB-E2E-01: idle state shows the upcoming meetings list', () => {
    cy.contains('Upcoming Meetings').should('be.visible');
    cy.contains('Priya Sharma').should('be.visible');
    cy.contains('Round 1').should('be.visible');
  });

  // ── FB-E2E-02: Connect button triggers waiting-room state ─────────────────

  it('FB-E2E-02: clicking Connect on a meeting opens the waiting-room panel', () => {
    cy.contains('Connect').click();
    cy.contains('Your meeting is starting!').should('be.visible');
    cy.contains('Join Call').should('be.visible');
  });

  // ── FB-E2E-03: ended state shows feedback form ────────────────────────────

  it('FB-E2E-03: ended state shows the YES/NO feedback form', () => {
    cy.window().then(win => {
      (win as any).__cypressSetCallState?.('ended');
    });

    cy.contains('How did it go?', { timeout: 5000 }).should('be.visible');
    cy.contains('Yes, meet again').should('be.visible');
    cy.contains('No thanks').should('be.visible');
  });

  // ── FB-E2E-04: YES feedback submits and shows next-match section ──────────

  it('FB-E2E-04: clicking YES submits feedback and reveals next-match options', () => {
    cy.window().then(win => {
      (win as any).__cypressSetCallState?.('ended');
    });

    cy.contains('Yes, meet again', { timeout: 5000 }).click();
    cy.wait('@feedback');

    cy.contains('Feedback recorded!').should('be.visible');
    cy.contains('Next Match').should('be.visible');
  });

  // ── FB-E2E-05: NO feedback submits and shows next-match section ───────────

  it('FB-E2E-05: clicking No thanks submits feedback and reveals next-match options', () => {
    cy.window().then(win => {
      (win as any).__cypressSetCallState?.('ended');
    });

    cy.contains('No thanks', { timeout: 5000 }).click();
    cy.wait('@feedback');

    cy.contains('Feedback recorded!').should('be.visible');
    cy.contains('Next Match').should('be.visible');
  });

  // ── FB-E2E-06: Next Match connecting response shows spinner ───────────────

  it('FB-E2E-06: Next Match with connecting response shows connecting message', () => {
    cy.window().then(win => { (win as any).__cypressSetCallState?.('ended'); });
    cy.contains('Yes, meet again', { timeout: 5000 }).click();
    cy.wait('@feedback');

    cy.contains('Next Match').click();
    cy.wait('@nextMatch');

    cy.contains('connecting now', { timeout: 5000 }).should('be.visible');
  });

  // ── FB-E2E-07: Next Match no-active shows offline message ────────────────

  it('FB-E2E-07: Next Match with no-active response shows no-active message', () => {
    cy.intercept('POST', `${API}/api/v1/matches/next`,
      { statusCode: 200, body: { statusCode: 200, message: 'No active match', data: null } }).as('nextNoActive');

    cy.window().then(win => { (win as any).__cypressSetCallState?.('ended'); });
    cy.contains('Yes, meet again', { timeout: 5000 }).click();
    cy.wait('@feedback');

    cy.contains('Next Match').click();
    cy.wait('@nextNoActive');

    cy.contains('No match is online', { timeout: 5000 }).should('be.visible');
  });

  // ── FB-E2E-08: Back to Meetings reloads the list ─────────────────────────

  it('FB-E2E-08: Back to Meetings returns to idle and reloads list', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`,
      { statusCode: 200, body: UPCOMING_BODY }).as('upcoming2');
    cy.intercept('POST', `${API}/api/v1/matches/next`,
      { statusCode: 200, body: { statusCode: 200, message: 'No active match', data: null } }).as('nextNoActive');

    cy.window().then(win => { (win as any).__cypressSetCallState?.('ended'); });
    cy.contains('Yes, meet again', { timeout: 5000 }).click();
    cy.wait('@feedback');

    cy.contains('Next Match').click();
    cy.wait('@nextNoActive');

    cy.contains('Back to Meetings').click();
    cy.wait('@upcoming2');

    cy.contains('Upcoming Meetings').should('be.visible');
  });
});
