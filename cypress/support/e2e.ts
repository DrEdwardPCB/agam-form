import '@testing-library/cypress/add-commands';

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('createForm', (title: string, description: string) => {
  cy.visit('/forms/new');
  cy.get('input[name="formTitle"]').type(title);
  cy.get('textarea[name="formDescription"]').type(description);
  cy.get('button').contains('Add Question').click();
  cy.get('input[placeholder="Question text"]').type('Test Question');
  cy.get('button').contains('Create Form').click();
});

Cypress.Commands.add('fillForm', (answers: Record<string, string>) => {
  Object.entries(answers).forEach(([question, answer]) => {
    cy.contains(question).parent().find('input').type(answer);
  });
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('register', (email: string, password: string) => {
  cy.visit('/register');
  cy.get('input[name="username"]').type('test');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createForm(title: string, description: string): Chainable<void>;
      fillForm(answers: Record<string, string>): Chainable<void>;
      register(email: string, password: string): Chainable<void>;
    }
  }
}
