export interface Issue {
  number: number
  title: string
  body: string
}

// A fixed batch of sample issues, so every run triages the same input.
export const issues: Issue[] = [
  {
    number: 1,
    title: 'Checkout page crashes after updating to the latest release',
    body: 'Since this morning\'s deploy, /checkout shows a 500 error for every user. The server log says `Cannot read properties of undefined (reading \'total\')`.',
  },
  {
    number: 2,
    title: 'Add dark mode',
    body: 'It would be great if the site followed the system color scheme.',
  },
  {
    number: 3,
    title: 'README still says to use npm 8',
    body: 'The setup section lists npm 8, but the project now requires Node 24 and pnpm.',
  },
  {
    number: 4,
    title: 'Search is slow',
    body: 'Typing in the search box takes a second or two to show results on my phone. Not sure if it is my connection.',
  },
  {
    number: 5,
    title: 'Upgrade Vitest',
    body: 'We are two major versions behind. Some test helpers are deprecated.',
  },
  {
    number: 6,
    title: 'Login button does nothing on Safari',
    body: 'Clicking "Log in" on Safari 19 does nothing. No error in the console. Works in Chrome. Maybe we should also add passkeys?',
  },
]
