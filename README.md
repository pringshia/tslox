# tslox

An implementation of the Lox programming language ([as specified in the book _Crafting Interpeters_](https://craftinginterpreters.com/the-lox-language.html)) written using **Typescript**.

## Wayfinding

- The main Typescript code for the library can be found in the `tslox/` folder.
  - `npm run build` will output the compiled library code into `dist/`.
  - `npm test` will run the tests in `tslox/tests/` to ensure assertions are met.
- A "test bench" exists, which is a React app interface that allows you to explore and understand the `tslox` library
  - See the app live! [**https://tslox.netlify.app**](https://tslox.netlify.app)
  - `npm run dev` launches the test bench on a local server.
  - `npm run build:webapp` will output the compiled webapp into `dist/`. (Useful for deployment and hosting the UI.)
