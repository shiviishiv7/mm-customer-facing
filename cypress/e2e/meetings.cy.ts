/**
 * Cypress E2E — My Meetings page
 *
 * Tests the /dashboard/scheduled-match page:
 * meetings list, Zoom join link, and post-meeting feedback form.
 */

const API = 'http://localhost:8080';

const FUTURE_MEETING = {
  id: '10',
  matchResultId: '5',
  roundNumber: 1,
  scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  durationMinutes: 30,
  status: 'SCHEDULED',
  meetingType: 'SCHEDULED',
  peerFirstName: 'Priya',
  peerLastName: 'Sharma',
  peerCognitoSub: 'sub-priya',
  zoomMeetingId: '123456789',
  zoomJoinUrl: 'https://zoom.us/j/123456789',
  zoomPassword: 'pass123',
};

const PAST_MEETING = {
  ...FUTURE_MEETING,
  id: '20',
  scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  status: 'COMPLETED',
  peerFirstName: 'Rohan',
  peerLastName: 'Verma',
};

const FEEDBACK_OK = { statusCode: 200, body: { statusCode: 200, message: 'Feedback submitted' } };

describe('My Meetings page', () => {

  beforeEach(() => {
    cy.login();
  });

  // ── MT-01: empty state shown when no meetings ─────────────────────────────

  it('MT-01: shows empty state when there are no upcoming meetings', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('No meetings yet').should('be.visible');
    cy.contains('Post & Find Match').should('be.visible');
  });

  // ── MT-02: meetings list renders peer name and time ───────────────────────

  it('MT-02: meetings list shows peer name, round number and scheduled time', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [FUTURE_MEETING] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Priya Sharma').should('be.visible');
    cy.contains('Round 1').should('be.visible');
    cy.contains('Upcoming').should('be.visible');
  });

  // ── MT-03: Zoom meeting details visible ───────────────────────────────────

  it('MT-03: Zoom meeting ID and password are visible on the meeting card', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [FUTURE_MEETING] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('123456789').should('be.visible');
    cy.contains('pass123').should('be.visible');
  });

  // ── MT-04: Join Zoom Meeting link is present ──────────────────────────────

  it('MT-04: Join Zoom Meeting link is visible and points to the Zoom URL', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [FUTURE_MEETING] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Join Zoom Meeting')
      .should('be.visible')
      .and('have.attr', 'href', 'https://zoom.us/j/123456789')
      .and('have.attr', 'target', '_blank');
  });

  // ── MT-05: past meeting shows 'Completed' badge and feedback ─────────────

  it('MT-05: past meeting shows Completed badge and Give Feedback button', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [PAST_MEETING] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Completed').should('be.visible');
    cy.contains('Give Feedback').should('be.visible');
  });

  // ── MT-06: Give Feedback opens inline question ────────────────────────────

  it('MT-06: clicking Give Feedback shows the YES/NO inline question', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [PAST_MEETING] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Give Feedback').click();
    cy.contains('Would you like to meet').should('be.visible');
    cy.contains('Yes, meet again').should('be.visible');
    cy.contains('No thanks').should('be.visible');
  });

  // ── MT-07: YES feedback submits and shows confirmation ───────────────────

  it('MT-07: clicking YES submits feedback and shows done state', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [PAST_MEETING] },
    }).as('upcoming');
    cy.intercept('POST', `${API}/api/v1/meetings/*/feedback`, FEEDBACK_OK).as('feedback');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Give Feedback').click();
    cy.contains('Yes, meet again').click();
    cy.wait('@feedback');

    cy.contains("You said yes", { timeout: 5000 }).should('be.visible');
  });

  // ── MT-08: NO feedback submits and shows done state ──────────────────────

  it('MT-08: clicking No thanks submits feedback and shows done state', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [PAST_MEETING] },
    }).as('upcoming');
    cy.intercept('POST', `${API}/api/v1/meetings/*/feedback`, FEEDBACK_OK).as('feedback');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Give Feedback').click();
    cy.contains('No thanks').click();
    cy.wait('@feedback');

    cy.contains('Looking for your next match', { timeout: 5000 }).should('be.visible');
  });

  // ── MT-09: Cancel collapses the inline feedback ──────────────────────────

  it('MT-09: Cancel hides the feedback form without submitting', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [PAST_MEETING] },
    }).as('upcoming');
    cy.intercept('POST', `${API}/api/v1/meetings/*/feedback`, FEEDBACK_OK).as('feedback');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Give Feedback').click();
    cy.contains('Would you like to meet').should('be.visible');
    cy.contains('Cancel').click();
    cy.contains('Would you like to meet').should('not.exist');
    cy.get('@feedback.all').should('have.length', 0);
  });

  // ── MT-10: both future and past meetings shown together ───────────────────

  it('MT-10: both upcoming and past meetings render in the same list', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [FUTURE_MEETING, PAST_MEETING] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Priya Sharma').should('be.visible');
    cy.contains('Rohan Verma').should('be.visible');
    cy.contains('Upcoming').should('be.visible');
    cy.contains('Completed').should('be.visible');
  });

  // ── MT-11: empty state CTA navigates to post-match ───────────────────────

  it('MT-11: Post & Find Match CTA navigates to post-match page', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [] },
    }).as('upcoming');

    cy.visit('/dashboard/scheduled-match');
    cy.wait('@upcoming');

    cy.contains('Post & Find Match').click();
    cy.url().should('include', '/dashboard/post-match');
  });
});
