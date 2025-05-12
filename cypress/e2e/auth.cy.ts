describe('Authentication', () => {
  beforeEach(() => {
    cy.register('test@example.com', 'password123');
    cy.visit('/');
  });

  it('should navigate to login page when clicking login', () => {
    cy.get('a').contains('Login').click();
    cy.url().should('include', '/login');
  });

  it('should show error message for invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should navigate to register page', () => {
    cy.visit('/login');
    cy.get('a').contains('create a new account').click();
    cy.url().should('include', '/register');
  });
});
