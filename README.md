# tslox

A **Typescript** implementation of the Lox programming language ([as specified in the book _Crafting Interpeters_](https://craftinginterpreters.com/the-lox-language.html)).

## Wayfinding

- The **main TypeScript interpreter code** for the library can be found in the `tslox/` folder.
  - `npm test` will run the tests in `tslox/tests/` to ensure assertions are met.
  - `npm run build` will output the compiled library code into `dist/`.
- An **interactive "test bench"** &mdash; is also provided. It is a React app that allows you to explore, understand, and prod the `tslox` library through a web interface.
  - Play with the test bench live! [**https://tslox.netlify.app**](https://tslox.netlify.app)
  - `npm run dev` launches the test bench on a local server.
  - `npm run build:webapp` will output the compiled webapp into `dist/`. (Useful for deployment and hosting the UI.)
