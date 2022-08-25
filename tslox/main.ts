import * as lexer from "@lib/lexer";
import * as parser from "@lib/parser";
import { ConsoleReporter } from "@lib/error";
import * as interpreter from "@lib/interpreter";

function execute(source: string, onError = ConsoleReporter.report): any {
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
  if (ast === null) {
    hasError = true;
    return;
  }

  const { result, errors: runtimeErrors } = interpreter.interpret(ast);
  if (runtimeErrors) {
    hasError = true;
    runtimeErrors.map(onError);
    return;
  }

  return result;
}

export { lexer, parser, execute };
