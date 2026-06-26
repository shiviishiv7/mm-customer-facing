/**
 * E2E: Post & Match flow
 *
 * Tests the full user journey on the /dashboard/post-match page.
 * All backend API calls are intercepted with cy.intercept() so no
 * real server is needed.
 */

const API = 'http://localhost:8080';

const ANALYZE_BODY = {
  statusCode: 200,
  data: {
    inferredCategory: 'PROFESSIONAL_MATRIMONY',
    categoryDisplayName: 'Matrimonial (Verified)',
    questions: [
      { id: 'q1', question: 'Which religion do you belong to?', type: 'dropdown',
        options: ['Hindu', 'Muslim', 'Christian', 'Sikh'], placeholder: '' },
      { id: 'q2', question: 'Preferred age range?', type: 'range', min: 22, max: 35, options: [] },
      { id: 'q3', question: 'Are you open to relocation?', type: 'boolean', options: [] },
    ],
  },
};

const SUBMIT_BODY = {
  statusCode: 200,
  data: {
    postId: 42, inferredCategory: 'PROFESSIONAL_MATRIMONY',
    categoryDisplayName: 'Matrimonial (Verified)', profileUpdated: true,
  },
};

const LONG_POST = '27M | Delhi | Looking for a sincere life partner who values family and integrity.';

describe('Post & Match flow', () => {

  beforeEach(() => {
    cy.stubWebSocket();
    cy.intercept('POST', `${API}/api/v1/posts/analyze`, { statusCode: 200, body: ANALYZE_BODY }).as('analyze');
    cy.intercept('POST', `${API}/api/v1/posts/submit`,  { statusCode: 200, body: SUBMIT_BODY }).as('submit');
    cy.login();
    cy.visit('/dashboard/post-match');
  });

  // ── PM-E2E-01: page renders writing state ─────────────────────────────────

  it('PM-E2E-01: renders the post writing screen by default', () => {
    cy.contains('Write Your').should('be.visible');
    cy.contains('Analyze & Continue').should('be.visible');
  });

  // ── PM-E2E-02: too-short post keeps button disabled ───────────────────────

  it('PM-E2E-02: Analyze button is disabled when post text is shorter than 50 chars', () => {
    cy.get('textarea').type('Too short');
    cy.contains('Analyze & Continue').should('be.disabled');
  });

  // ── PM-E2E-03: analyze call shows questions ───────────────────────────────

  it('PM-E2E-03: submitting a long post calls /analyze and shows follow-up questions', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Analyze & Continue').click();
    cy.wait('@analyze');

    cy.contains('A Few', { timeout: 10000 }).should('be.visible');
    cy.contains('Which religion').should('be.visible');
  });

  // ── PM-E2E-04: category badge displayed ──────────────────────────────────

  it('PM-E2E-04: inferred category badge shows after analysis', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Analyze & Continue').click();
    cy.wait('@analyze');

    cy.contains('Matrimonial', { timeout: 10000 }).should('be.visible');
  });

  // ── PM-E2E-05: submit transitions to waiting state ───────────────────────

  it('PM-E2E-05: answering questions and submitting transitions to waiting state', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Analyze & Continue').click();
    cy.wait('@analyze');

    cy.contains('Submit & Find Matches', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.contains('Finding your matches', { timeout: 10000 }).should('be.visible');
  });

  // ── PM-E2E-06: no-active-match state ─────────────────────────────────────

  it('PM-E2E-06: POST_NO_ACTIVE_MATCH event shows match-saved screen', () => {
    cy.intercept('POST', `${API}/api/v1/posts/submit`, {
      statusCode: 200,
      body: { statusCode: 200, data: { postId: 1, profileUpdated: true } },
    }).as('submit2');

    cy.get('textarea').type(LONG_POST);
    cy.contains('Analyze & Continue').click();
    cy.wait('@analyze');
    cy.contains('Submit & Find Matches', { timeout: 10000 }).click();
    cy.wait('@submit2');

    // Simulate WebSocket push via window injection
    cy.window().then(win => {
      (win as any).__cypressInjectMatchNotification?.({
        event: 'POST_NO_ACTIVE_MATCH',
        message: 'Match saved, no one online.',
      });
    });

    cy.contains('Match Saved!', { timeout: 10000 }).should('be.visible');
    cy.contains('Go to Meetings').should('be.visible');
  });

  // ── PM-E2E-07: no-match state ─────────────────────────────────────────────

  it('PM-E2E-07: POST_NO_MATCH_FOUND event shows no-candidates screen', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Analyze & Continue').click();
    cy.wait('@analyze');
    cy.contains('Submit & Find Matches', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.window().then(win => {
      (win as any).__cypressInjectMatchNotification?.({
        event: 'POST_NO_MATCH_FOUND',
        message: 'No match found.',
      });
    });

    cy.contains('Post Saved!', { timeout: 10000 }).should('be.visible');
    cy.contains('Write Another Post').should('be.visible');
  });

  // ── PM-E2E-08: reset returns to writing state ─────────────────────────────

  it('PM-E2E-08: Write Another Post button resets the form to writing state', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Analyze & Continue').click();
    cy.wait('@analyze');
    cy.contains('Submit & Find Matches', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.window().then(win => {
      (win as any).__cypressInjectMatchNotification?.({
        event: 'POST_NO_MATCH_FOUND',
        message: 'No match found.',
      });
    });

    cy.contains('Write Another Post', { timeout: 10000 }).click();
    cy.contains('Write Your').should('be.visible');
    cy.get('textarea').should('have.value', '');
  });
});
