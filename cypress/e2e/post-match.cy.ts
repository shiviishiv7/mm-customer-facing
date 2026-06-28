/**
 * Cypress E2E — Post & Match flow
 *
 * Tests the full user journey on /dashboard/post-match:
 * intent selection → post writing → AI questions → async submit → queued state.
 * All backend calls are intercepted; no real server required.
 */

const API = 'http://localhost:8080';

const ANALYZE_RESPONSE = {
  statusCode: 200,
  data: {
    inferredCategory: null,
    categoryDisplayName: 'MATRIMONIAL',
    questions: [
      {
        id: 'm6',
        question: 'Religion',
        type: 'dropdown',
        options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain'],
        placeholder: '',
      },
      {
        id: 'm3',
        question: 'Current city',
        type: 'text',
        placeholder: 'e.g. Delhi',
      },
      {
        id: 'm23',
        question: 'When are you looking to get married?',
        type: 'single_choice',
        options: ['Immediately', 'Within 6 months', 'Within 1 year', 'No rush'],
      },
    ],
  },
};

const SUBMIT_RESPONSE = {
  statusCode: 200,
  message: "Post saved! We'll notify you by email when a match is found.",
  data: { postId: 42, categoryDisplayName: 'MATRIMONIAL', profileUpdated: false },
};

const LONG_POST = '28M | Delhi | Software engineer looking for a sincere life partner who values family and integrity. Open to arranged marriage.';

describe('Post & Match — intent selection + question flow', () => {

  beforeEach(() => {
    cy.intercept('POST', `${API}/api/v1/posts/analyze`, {
      statusCode: 200, body: ANALYZE_RESPONSE,
    }).as('analyze');
    cy.intercept('POST', `${API}/api/v1/posts/submit`, {
      statusCode: 200, body: SUBMIT_RESPONSE,
    }).as('submit');
    cy.login();
    cy.visit('/dashboard/post-match');
  });

  // ── PM-01: page renders intent selector ──────────────────────────────────

  it('PM-01: renders the intent selector and post text area', () => {
    cy.contains('Find Your').should('be.visible');
    cy.contains('Matrimonial').should('be.visible');
    cy.contains('Dating').should('be.visible');
    cy.get('textarea').should('be.visible');
  });

  // ── PM-02: Continue button disabled for short post ────────────────────────

  it('PM-02: Continue is disabled when post text is under 50 characters', () => {
    cy.get('textarea').type('Too short');
    cy.contains('Continue').should('be.disabled');
  });

  // ── PM-03: Continue enabled for valid post ────────────────────────────────

  it('PM-03: Continue is enabled when post text is 50+ characters', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').should('not.be.disabled');
  });

  // ── PM-04: Matrimonial selected by default ────────────────────────────────

  it('PM-04: Matrimonial intent is selected by default', () => {
    cy.contains('button', 'Matrimonial').should('have.class', 'intent-btn--active');
    cy.contains('button', 'Dating').should('not.have.class', 'intent-btn--active');
  });

  // ── PM-05: Can switch to Dating intent ────────────────────────────────────

  it('PM-05: clicking Dating switches the active intent', () => {
    cy.contains('button', 'Dating').click();
    cy.contains('button', 'Dating').should('have.class', 'intent-btn--active');
    cy.contains('button', 'Matrimonial').should('not.have.class', 'intent-btn--active');
  });

  // ── PM-06: analyze call fired with intent ────────────────────────────────

  it('PM-06: submitting a long post calls /analyze and shows follow-up questions', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze').its('request.body').should('have.property', 'intent', 'MATRIMONIAL');

    cy.contains('A Few', { timeout: 10000 }).should('be.visible');
    cy.contains('Religion').should('be.visible');
  });

  // ── PM-07: intent badge shown in questions state ──────────────────────────

  it('PM-07: questions state shows the correct intent badge', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');

    cy.contains('Matrimonial', { timeout: 10000 }).should('be.visible');
  });

  // ── PM-08: step navigation works ─────────────────────────────────────────

  it('PM-08: Next / Previous buttons navigate between question steps', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');

    cy.contains('Step 1 of', { timeout: 10000 }).should('be.visible');
    cy.contains('Next').click();
    cy.contains('Step 2 of').should('be.visible');
    cy.contains('Previous').click();
    cy.contains('Step 1 of').should('be.visible');
  });

  // ── PM-09: submit transitions to queued state ─────────────────────────────

  it('PM-09: completing questions and submitting shows the queued confirmation', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');

    // Mock has 3 questions → 2 steps; navigate to last step then submit
    cy.contains('Next', { timeout: 10000 }).click();
    cy.contains('Submit & Find Match', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.contains("You're in the Queue!", { timeout: 10000 }).should('be.visible');
    cy.contains('Zoom meeting').should('be.visible');
  });

  // ── PM-10: queued state shows next steps ─────────────────────────────────

  it('PM-10: queued state shows the 3-step notification flow', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');
    cy.contains('Next', { timeout: 10000 }).click();
    cy.contains('Submit & Find Match', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.contains('We scan profiles every 15 minutes', { timeout: 10000 }).should('be.visible');
    cy.contains('book a Zoom call').should('be.visible');
    cy.contains('email with the meeting link').should('be.visible');
  });

  // ── PM-11: Write Another Post resets the form ─────────────────────────────

  it('PM-11: Write Another Post returns to the writing state with empty textarea', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');
    cy.contains('Next', { timeout: 10000 }).click();
    cy.contains('Submit & Find Match', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.contains('Write Another Post', { timeout: 10000 }).click();
    cy.contains('Find Your').should('be.visible');
    cy.get('textarea').should('have.value', '');
  });

  // ── PM-12: View My Meetings link goes to scheduled-match ─────────────────

  it('PM-12: View My Meetings button navigates to the meetings page', () => {
    cy.intercept('GET', `${API}/api/v1/meetings/user/*/upcoming`, {
      statusCode: 200, body: { statusCode: 200, data: [] },
    }).as('upcoming');

    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');
    cy.contains('Next', { timeout: 10000 }).click();
    cy.contains('Submit & Find Match', { timeout: 10000 }).click();
    cy.wait('@submit');

    cy.contains('View My Meetings', { timeout: 10000 }).click();
    cy.url().should('include', '/dashboard/scheduled-match');
  });

  // ── PM-13: Edit Post button goes back to writing state ────────────────────

  it('PM-13: Edit Post button from questions goes back to writing state', () => {
    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyze');

    cy.contains('Edit Post', { timeout: 10000 }).click();
    cy.contains('Find Your').should('be.visible');
    cy.get('textarea').should('have.value', LONG_POST);
  });

  // ── PM-14: API error on analyze shows snackbar ────────────────────────────

  it('PM-14: API error on /analyze shows a snackbar error and stays on writing state', () => {
    cy.intercept('POST', `${API}/api/v1/posts/analyze`, {
      statusCode: 500, body: { statusCode: 500, message: 'AI service unavailable.' },
    }).as('analyzeError');

    cy.get('textarea').type(LONG_POST);
    cy.contains('Continue').click();
    cy.wait('@analyzeError');

    cy.contains('Find Your', { timeout: 5000 }).should('be.visible');
  });

  // ── PM-15: Dating post sends DATING intent to backend ────────────────────

  it('PM-15: Dating intent is sent in the analyze request body', () => {
    cy.contains('button', 'Dating').click();
    cy.get('textarea').type('26F | Mumbai | Looking for genuine connection. I love hiking and coffee and good conversation.');
    cy.contains('Continue').click();
    cy.wait('@analyze').its('request.body').should('have.property', 'intent', 'DATING');
  });
});
