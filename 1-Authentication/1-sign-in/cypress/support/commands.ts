// @ts-check
///<reference path="../global.d.ts" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

function loginViaAAD(username: string, password: string) {
    cy.visit('/')
    cy.get('button#signIn').click()

    // Login to your AAD tenant.
    cy.origin(
        'login.microsoftonline.com',
        {
            args: {
                username,
            },
        },
        ({ username }) => {
            cy.get('input[type="email"]').type(username, {
                log: false,
            })
            cy.get('input[type="submit"]').click()
        }
    )

    // depending on the user and how they are registered with Microsoft, the origin may go to live.com
    cy.origin(
        'login.live.com',
        {
            args: {
                password,
            },
        },
        ({ password }) => {
            cy.get('input[type="password"]').type(password, {
                log: false,
            })
            cy.get('button[type="submit"]').click()
            cy.get('#acceptButton').click()
        }
    )

    // Ensure Microsoft has redirected us back to the sample app with our logged in user.
    cy.location().should('equal', 'http://localhost:3000/')
    cy.get('#welcome-div').should(
        'contain',
        `Welcome ${Cypress.env('aad_username')}!`
    )
}

Cypress.Commands.add('loginToAAD', (username: string, password: string) => {
    cy.session(
        `aad-${username}`,
        () => {
            const log = Cypress.log({
                displayName: 'Azure Active Directory Login',
                message: [`🔐 Authenticating | ${username}`],
                // @ts-ignore
                autoEnd: false,
            })

            log.snapshot('before')

            loginViaAAD(username, password)

            log.snapshot('after')
            log.end()
        },
        {
            validate: () => {
                // this is a very basic form of session validation for this demo.
                // depending on your needs, something more verbose might be needed
                cy.visit('/')
                cy.get('#welcome-div').should(
                    'contain',
                    `Welcome ${Cypress.env('aad_username')}!`
                )
            },
        }
    )
})