import * as lexer from "./lexer";
import { ConsoleReporter } from "./error";

function execute(source: string, onError = ConsoleReporter.report) {
  let hasError = false;

  const { result: tokens, errors: lexErrors } = lexer.getTokens(source);
  if (lexErrors) {
    hasError = true;
  }
}

export { lexer, execute };
