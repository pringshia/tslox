import { Response } from "@lib/base";
import * as lexer from "@lib/lexer";
import { Parser, parse } from "@lib/parser";
import { ConsoleReporter } from "@lib/error";
import { Interpreter } from "@lib/interpreter";
import { Resolver } from "./resolver";

function executeProgram(source: string, onError = ConsoleReporter.report): any {
  let hasError = false;

  const { result: tokens, errors: lexErrors } = lexer.getTokens(source);
  if (lexErrors && !!lexErrors.length) {
    hasError = true;
    lexErrors.map(onError);
    return;
  }
  const { result: ast, errors: parseErrors } = parse(tokens);
  if (parseErrors && !!parseErrors.length) {
    hasError = true;
    parseErrors.map(onError);
    return;
  }
  if (ast === null) {
    hasError = true;
    return;
  }

  const interpreter = new Interpreter();
  new Resolver(interpreter).resolveStmts(ast);
  // console.warn(interpreter.locals);

  const { result, errors: runtimeErrors } = interpreter.interpret(ast);
  if (runtimeErrors && !!runtimeErrors.length) {
    hasError = true;
    runtimeErrors.map(onError);
    return;
  }

  return { tokens, ast, result };
}

function readEval(source: string): Response<any> {
  const lexedResult = lexer.getTokens(source);
  const { result: tokens, errors: lexErrors } = lexedResult;
  if (lexErrors && !!lexErrors.length) {
    return lexedResult;
  }
  const parsedResult = new Parser(tokens).read();
  const { result: ast, errors: parseErrors } = parsedResult;
  if ((parseErrors && !!parseErrors.length) || ast == null) {
    return parsedResult;
  }
  const interpreter = new Interpreter();
  new Resolver(interpreter).resolveExpr(ast);

  const interpretedResult = interpreter.evaluator(ast);
  // const { result, errors: runtimeErrors } = interpretedResult;
  return interpretedResult;
}

export { lexer, readEval, executeProgram };
