/**
 * Cypress E2E — Landing page
 *
 * Tests the public landing page at /landing:
 * copy, CTA button, how-it-works steps, and feature cards.
 */

describe('Landing page', () => {

  beforeEach(() => {
    cy.visit('/landing');
  });

  // ── LP-01: hero copy visible ──────────────────────────────────────────────

  it('LP-01: hero title and subtitle are visible', () => {
    cy.contains('Find Your').should('be.visible');
    cy.contains('Life Partner').should('be.visible');
    cy.contains('Dating and matrimonial matching').should('be.visible');
  });

  // ── LP-02: professional badge present ────────────────────────────────────

  it('LP-02: "For Working Professionals" badge is visible', () => {
    cy.contains('For Working Professionals').should('be.visible');
  });

  // ── LP-03: CTA button present ────────────────────────────────────────────

  it('LP-03: Get Started CTA button is present and enabled', () => {
    cy.contains('Get Started').should('be.visible').and('not.be.disabled');
  });

  // ── LP-04: How it works section ──────────────────────────────────────────

  it('LP-04: How it works section shows all 4 steps', () => {
    cy.contains('How it works').should('be.visible');
    cy.contains('Write a post').should('be.visible');
    cy.contains('We find your match').should('be.visible');
    cy.contains('Get a Zoom invite').should('be.visible');
    cy.contains('Meet & decide').should('be.visible');
  });

  // ── LP-05: features section present ──────────────────────────────────────

  it('LP-05: features section shows all 3 feature cards', () => {
    cy.contains('Working Professionals Only').should('be.visible');
    cy.contains('Dating & Matrimonial').should('be.visible');
    cy.contains('Quality over Quantity').should('be.visible');
  });

  // ── LP-06: Zoom mentioned in steps ───────────────────────────────────────

  it('LP-06: Zoom is mentioned in the how-it-works steps', () => {
    cy.contains('Zoom').should('be.visible');
  });

  // ── LP-07: no instant-meeting or chatbot references ──────────────────────

  it('LP-07: no references to removed features (instant meeting, chat bot)', () => {
    cy.contains('Instant Meeting').should('not.exist');
    cy.contains('Chat & Match').should('not.exist');
    cy.contains('WebRTC').should('not.exist');
  });

  // ── LP-08: page is responsive on mobile ──────────────────────────────────

  it('LP-08: page renders correctly at mobile width (375px)', () => {
    cy.viewport(375, 812);
    cy.contains('Find Your').should('be.visible');
    cy.contains('Get Started').should('be.visible');
  });
});
