import * as lexer from "@lib/lexer";
import * as parser from "@lib/parser";
import { ConsoleReporter } from "@lib/error";

function execute(source: string, onError = ConsoleReporter.report) {
  let hasError = false;

  const { result: tokens, errors: lexErrors } = lexer.getTokens(source);
  if (lexErrors) {
    hasError = true;
    lexErrors.map(onError);
    return;
  }
  const { result: ast, errors: parseErrors } = parser.parse(tokens);
  if (parseErrors) {
    hasError = true;
    parseErrors.map(onError);
    return;
  }
}

export { lexer, parser, execute };
