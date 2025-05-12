describe('Forms Management', () => {
  it('should create a new form', () => {
    cy.login('test@example.com', 'password123');
    cy.createForm('Test Form', 'This is a test form');
    cy.url().should('include', '/forms');
    cy.contains('Test Form').should('be.visible');
  });

  it('should edit an existing form', () => {
    cy.createForm('Original Title', 'Original Description');

    cy.contains('Original Title').parent().parent().contains('Edit').click();
    cy.get('input[name="formTitle"]').clear().type('Updated Title');
    cy.get('textarea[name="formDescription"]').clear().type('Updated Description');
    cy.get('button').contains('Create Form').click();

    cy.contains('Updated Title').should('be.visible');
    cy.contains('Updated Description').should('be.visible');
  });
});
