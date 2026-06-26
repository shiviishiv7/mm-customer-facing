// Custom Cypress commands

// Minimal valid-format JWT with sub = "test-user" (expiry check is disabled in AuthService)
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJleHAiOjk5OTk5OTk5OTl9.' +
  'fakesignature';

/**
 * Place a fake auth token in localStorage so authGuard passes.
 * Must be called before cy.visit() for protected routes.
 */
Cypress.Commands.add('login', () => {
  cy.window().then(win => {
    win.localStorage.setItem('authToken', FAKE_JWT);
  });
});

/**
 * Stub the backend WebSocket so tests don't need a real server.
 */
Cypress.Commands.add('stubWebSocket', () => {
  cy.intercept('GET', '/ws/**', { statusCode: 200, body: '' }).as('wsHandshake');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      stubWebSocket(): Chainable<void>;
    }
  }
}
