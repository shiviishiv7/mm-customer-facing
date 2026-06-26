// Global Cypress support file
// Runs before every spec file

import './commands';

// Silence uncaught exceptions from the app that would fail tests
Cypress.on('uncaught:exception', () => false);
