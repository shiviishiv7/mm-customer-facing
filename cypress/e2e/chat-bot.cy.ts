/**
 * E2E: Chat Bot flow
 *
 * Tests the full user journey: session list → start session → chat → category
 * detection → questions → submit → match search.
 * All backend API calls are intercepted — no real server needed.
 */

const API = 'http://localhost:8080';

// ─── Stub fixtures ──────────────────────────────────────────────────────────

const SESSION_NEW = {
  id: 1,
  detectedCategory: null,
  status: 'IN_PROGRESS',
  questionCount: 0,
  conversationHistory: [
    { role: 'assistant', content: "Hey! 👋 What are you looking for today?" },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SESSION_WITH_CATEGORY = {
  ...SESSION_NEW,
  detectedCategory: 'GYM_PARTNER',
  questionCount: 3,
  conversationHistory: [
    { role: 'assistant', content: "Hey! 👋 What are you looking for today?" },
    { role: 'user', content: 'I want a gym partner' },
    { role: 'assistant', content: "Got it! You're looking for a Gym & Workout Partner. What city are you based in?" },
  ],
};

const SESSION_AWAITING_SUBMIT = {
  ...SESSION_WITH_CATEGORY,
  status: 'AWAITING_SUBMIT',
  questionCount: 10,
  conversationHistory: [
    ...SESSION_WITH_CATEGORY.conversationHistory,
    { role: 'user', content: 'Mumbai' },
    { role: 'assistant', content: "I have a good picture of what you're looking for! Ready to find your match?" },
  ],
};

const SESSION_LIST_EMPTY: any[] = [];

const SESSION_LIST = [SESSION_NEW, SESSION_WITH_CATEGORY];

const BOT_REPLY_TOKEN = 'Got it! You're looking for a Gym & Workout Partner.';

const METADATA_IN_PROGRESS = JSON.stringify({
  type: 'metadata',
  detectedCategory: 'GYM_PARTNER',
  categoryDisplayName: 'Gym & Workout Partner',
  status: 'IN_PROGRESS',
  questionCount: 1,
  detectedCategories: null,
});

const METADATA_MULTI_CATEGORY = JSON.stringify({
  type: 'metadata',
  detectedCategory: null,
  categoryDisplayName: null,
  status: 'IN_PROGRESS',
  questionCount: 1,
  detectedCategories: ['GYM_PARTNER', 'TRAVEL_TREKKING'],
});

const METADATA_AWAITING_SUBMIT = JSON.stringify({
  type: 'metadata',
  detectedCategory: 'GYM_PARTNER',
  categoryDisplayName: 'Gym & Workout Partner',
  status: 'AWAITING_SUBMIT',
  questionCount: 10,
  detectedCategories: null,
});

const SUBMIT_RESPONSE = {
  sessionId: 1,
  category: 'GYM_PARTNER',
  collectedAttributes: { fitnessLevel: 'intermediate', preferredCity: 'Mumbai' },
};

// ─── Helper: stub SSE stream ────────────────────────────────────────────────

/**
 * Stubs the SSE message endpoint with a fake stream response.
 * Sends one token line then a metadata event then a done event.
 */
function stubSseMessage(metadata: string, token = BOT_REPLY_TOKEN): void {
  const body =
    `event: token\ndata: ${token}\n\n` +
    `event: metadata\ndata: ${metadata}\n\n` +
    `event: done\ndata: \n\n`;

  cy.intercept('POST', `${API}/api/v1/chat/session/*/message`, {
    statusCode: 200,
    headers: { 'Content-Type': 'text/event-stream' },
    body,
  }).as('sendMessage');
}

// ────────────────────────────────────────────────────────────────────────────

describe('Chat Bot — Session List', () => {

  beforeEach(() => {
    cy.stubWebSocket();
    cy.login();
  });

  // CB-E2E-01
  it('CB-E2E-01: shows empty state when user has no sessions', () => {
    cy.intercept('GET', `${API}/api/v1/chat/sessions`, { body: SESSION_LIST_EMPTY }).as('sessions');
    cy.visit('/dashboard/chat-bot');
    cy.wait('@sessions');
    cy.contains('No chats yet').should('be.visible');
    cy.contains('Start New Chat').should('be.visible');
  });

  // CB-E2E-02
  it('CB-E2E-02: lists existing sessions with status and question count', () => {
    cy.intercept('GET', `${API}/api/v1/chat/sessions`, { body: SESSION_LIST }).as('sessions');
    cy.visit('/dashboard/chat-bot');
    cy.wait('@sessions');
    cy.contains('In Progress').should('be.visible');
    cy.get('.session-card').should('have.length', 2);
  });

  // CB-E2E-03
  it('CB-E2E-03: Start New Chat creates a session and navigates to chat window', () => {
    cy.intercept('GET', `${API}/api/v1/chat/sessions`, { body: SESSION_LIST_EMPTY }).as('sessions');
    cy.intercept('POST', `${API}/api/v1/chat/session/start`, { body: SESSION_NEW }).as('start');
    cy.visit('/dashboard/chat-bot');
    cy.wait('@sessions');
    cy.contains('Start New Chat').click();
    cy.wait('@start');
    cy.url().should('include', '/dashboard/chat-bot/1');
  });

  // CB-E2E-04
  it('CB-E2E-04: clicking a session card navigates to that chat window', () => {
    cy.intercept('GET', `${API}/api/v1/chat/sessions`, { body: SESSION_LIST }).as('sessions');
    cy.visit('/dashboard/chat-bot');
    cy.wait('@sessions');
    cy.get('.session-card').first().click();
    cy.url().should('include', '/dashboard/chat-bot/');
  });

});

// ────────────────────────────────────────────────────────────────────────────

describe('Chat Bot — Chat Window', () => {

  beforeEach(() => {
    cy.stubWebSocket();
    cy.login();
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_NEW }).as('getSession');
  });

  // CB-E2E-05
  it('CB-E2E-05: loads session and shows opening bot message', () => {
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains("What are you looking for today").should('be.visible');
  });

  // CB-E2E-06
  it('CB-E2E-06: send button is disabled when input is empty', () => {
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.get('.send-btn').should('be.disabled');
  });

  // CB-E2E-07
  it('CB-E2E-07: typing a message enables the send button', () => {
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.get('.input-field').type('I want a gym partner');
    cy.get('.send-btn').should('not.be.disabled');
  });

  // CB-E2E-08
  it('CB-E2E-08: sending a message calls the SSE endpoint and renders bot reply', () => {
    stubSseMessage(METADATA_IN_PROGRESS);
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.get('.input-field').type('I want a gym partner');
    cy.get('.send-btn').click();
    cy.wait('@sendMessage');

    cy.contains('Gym & Workout Partner', { timeout: 6000 }).should('be.visible');
  });

  // CB-E2E-09
  it('CB-E2E-09: pressing Enter sends the message', () => {
    stubSseMessage(METADATA_IN_PROGRESS);
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.get('.input-field').type('I want a gym partner{enter}');
    cy.wait('@sendMessage');
    cy.contains(BOT_REPLY_TOKEN, { timeout: 6000 }).should('be.visible');
  });

  // CB-E2E-10
  it('CB-E2E-10: user message appears in a right-aligned bubble', () => {
    stubSseMessage(METADATA_IN_PROGRESS);
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.get('.input-field').type('I want a gym partner');
    cy.get('.send-btn').click();

    cy.get('.message-row.user').should('contain.text', 'I want a gym partner');
  });

  // CB-E2E-11
  it('CB-E2E-11: back button navigates to session list', () => {
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.get('button[mattooltip="Back to sessions"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/dashboard/chat-bot');
  });

});

// ────────────────────────────────────────────────────────────────────────────

describe('Chat Bot — Category Detection', () => {

  beforeEach(() => {
    cy.stubWebSocket();
    cy.login();
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_NEW }).as('getSession');
  });

  // CB-E2E-12
  it('CB-E2E-12: single category detected — updates topbar category name', () => {
    stubSseMessage(METADATA_IN_PROGRESS);
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.get('.input-field').type('I want a gym partner');
    cy.get('.send-btn').click();
    cy.wait('@sendMessage');

    cy.get('.topbar-category', { timeout: 6000 }).should('contain.text', 'GYM');
  });

  // CB-E2E-13
  it('CB-E2E-13: multiple categories detected — shows selection chips', () => {
    stubSseMessage(METADATA_MULTI_CATEGORY, 'I found a few matches! Please select one:');
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.get('.input-field').type('I want a gym partner or travel buddy');
    cy.get('.send-btn').click();
    cy.wait('@sendMessage');

    cy.contains('Please select one', { timeout: 6000 }).should('be.visible');
    cy.get('.category-chip-btn').should('have.length.gte', 2);
  });

  // CB-E2E-14
  it('CB-E2E-14: selecting a category chip sends it as a user message', () => {
    stubSseMessage(METADATA_MULTI_CATEGORY, 'I found a few matches!');
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.get('.input-field').type('gym or travel');
    cy.get('.send-btn').click();
    cy.wait('@sendMessage');

    // Now stub next message for selection
    stubSseMessage(METADATA_IN_PROGRESS, "Great choice! Let's find you a gym partner.");
    cy.get('.category-chip-btn').first().click();
    cy.wait('@sendMessage');

    cy.get('.message-row.user').last().should('contain.text', "I'd like to go with");
  });

});

// ────────────────────────────────────────────────────────────────────────────

describe('Chat Bot — Submit & Match Search', () => {

  beforeEach(() => {
    cy.stubWebSocket();
    cy.login();
  });

  // CB-E2E-15
  it('CB-E2E-15: Find My Match button appears when status is AWAITING_SUBMIT', () => {
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_AWAITING_SUBMIT }).as('getSession');
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains('Find My Match').should('be.visible');
  });

  // CB-E2E-16
  it('CB-E2E-16: Find My Match is not visible while status is IN_PROGRESS', () => {
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_NEW }).as('getSession');
    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains('Find My Match').should('not.exist');
  });

  // CB-E2E-17
  it('CB-E2E-17: clicking Find My Match calls submit and shows searching screen', () => {
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_AWAITING_SUBMIT }).as('getSession');
    cy.intercept('POST', `${API}/api/v1/chat/session/1/submit`, { body: SUBMIT_RESPONSE }).as('submit');

    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains('Find My Match').click();
    cy.wait('@submit');

    cy.contains('Finding your matches', { timeout: 6000 }).should('be.visible');
  });

  // CB-E2E-18
  it('CB-E2E-18: POST_MATCH_CONNECTING event navigates to scheduled-match', () => {
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_AWAITING_SUBMIT }).as('getSession');
    cy.intercept('POST', `${API}/api/v1/chat/session/1/submit`, { body: SUBMIT_RESPONSE }).as('submit');
    cy.intercept('GET', '/dashboard/scheduled-match', {}).as('scheduledMatch');

    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains('Find My Match').click();
    cy.wait('@submit');

    cy.window().then(win => {
      (win as any).__cypressInjectMatchNotification?.({
        event: 'POST_MATCH_CONNECTING',
        message: 'Match found and connecting now!',
      });
    });

    cy.url({ timeout: 5000 }).should('include', '/dashboard/scheduled-match');
  });

  // CB-E2E-19
  it('CB-E2E-19: POST_NO_ACTIVE_MATCH shows notification screen', () => {
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_AWAITING_SUBMIT }).as('getSession');
    cy.intercept('POST', `${API}/api/v1/chat/session/1/submit`, { body: SUBMIT_RESPONSE }).as('submit');

    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains('Find My Match').click();
    cy.wait('@submit');

    cy.window().then(win => {
      (win as any).__cypressInjectMatchNotification?.({
        event: 'POST_NO_ACTIVE_MATCH',
        message: 'No one is online right now.',
      });
    });

    cy.contains("Match saved!", { timeout: 6000 }).should('be.visible');
    cy.contains("We'll notify you").should('be.visible');
  });

  // CB-E2E-20
  it('CB-E2E-20: POST_NO_MATCH_FOUND shows no-match screen', () => {
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_AWAITING_SUBMIT }).as('getSession');
    cy.intercept('POST', `${API}/api/v1/chat/session/1/submit`, { body: SUBMIT_RESPONSE }).as('submit');

    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');
    cy.contains('Find My Match').click();
    cy.wait('@submit');

    cy.window().then(win => {
      (win as any).__cypressInjectMatchNotification?.({
        event: 'POST_NO_MATCH_FOUND',
        message: 'No candidates found.',
      });
    });

    cy.contains('No matches yet', { timeout: 6000 }).should('be.visible');
  });

  // CB-E2E-21
  it('CB-E2E-21: submitted session shows submitted banner and hides input bar', () => {
    const submittedSession = { ...SESSION_AWAITING_SUBMIT, status: 'SUBMITTED' };
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: submittedSession }).as('getSession');

    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.contains('Match search submitted').should('be.visible');
    cy.get('.input-bar').should('not.exist');
  });

});

// ────────────────────────────────────────────────────────────────────────────

describe('Chat Bot — Session Resume', () => {

  // CB-E2E-22
  it('CB-E2E-22: navigating directly to /chat-bot/:id loads existing conversation', () => {
    cy.stubWebSocket();
    cy.login();
    cy.intercept('GET', `${API}/api/v1/chat/session/1`, { body: SESSION_WITH_CATEGORY }).as('getSession');

    cy.visit('/dashboard/chat-bot/1');
    cy.wait('@getSession');

    cy.contains("What city are you based in", { timeout: 6000 }).should('be.visible');
    cy.get('.topbar-meta').should('contain.text', '3 questions');
  });

  // CB-E2E-23
  it('CB-E2E-23: Chat & Match sidebar link is visible on dashboard', () => {
    cy.stubWebSocket();
    cy.login();
    cy.intercept('GET', `${API}/api/v1/chat/sessions`, { body: SESSION_LIST_EMPTY }).as('sessions');

    cy.visit('/dashboard/chat-bot');
    cy.get('mat-drawer').contains('Chat & Match').should('be.visible');
  });

});
