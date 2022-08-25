import { match, P } from "ts-pattern";
import { Binary, Expr, Grouping, Literal, Unary } from "@lib/grammar";
import { Token, TokenType } from "@lib/tokens";
import { isRuntimeError, RuntimeError } from "@lib/error";
import { Response } from "@lib/base";

export function interpret(expr: Expr): Response<any> {
  try {
    const value = evaluate(expr);
    return { result: value };
  } catch (error) {
    if (isRuntimeError(error)) {
      return { result: null, errors: [error] };
    } else {
      throw error;
    }
  }
}

export function stringify(obj: any): string {
  return match(obj)
    .with(null, () => "nil")
    .otherwise(() => "" + obj);
}

function visitLiteralExpr(expr: Literal): any {
  return expr.value;
}
function visitGroupingExpr(expr: Grouping): any {
  return evaluate(expr.expression);
}
function visitUnaryExpr(expr: Unary): any {
  const right = evaluate(expr.right);
  return match(expr.operator.type)
    .with(TokenType.MINUS, () => {
      checkNumberOperand(expr.operator, right);
      return -1 * right;
    })
    .with(TokenType.BANG, () => !isTruthy(right))
    .otherwise(() => null);
}
function visitBinaryExpr(expr: Binary): any {
  const left = evaluate(expr.left);
  const right = evaluate(expr.right);

  return match(expr.operator.type)
    .with(TokenType.MINUS, () => {
      checkNumberOperands(expr.operator, left, right);
      return left - right;
    })
    .with(TokenType.SLASH, () => {
      checkNumberOperands(expr.operator, left, right);
      return left / right;
    })
    .with(TokenType.STAR, () => {
      checkNumberOperands(expr.operator, left, right);
      return left * right;
    })
    .with(TokenType.PLUS, () => {
      if (typeof left === "number" && typeof right === "number")
        return left + right;
      else if (typeof left === "string" && typeof right === "string")
        return left + right;
      else {
        const error: RuntimeError = {
          token: expr.operator,
          message: "Operands must be two numbers or two strings.",
        };
        throw error;
      }
    })
    .with(TokenType.GREATER, () => {
      checkNumberOperands(expr.operator, left, right);
      return left > right;
    })
    .with(TokenType.GREATER_EQUAL, () => {
      checkNumberOperands(expr.operator, left, right);
      return left >= right;
    })
    .with(TokenType.LESS, () => {
      checkNumberOperands(expr.operator, left, right);
      return left < right;
    })
    .with(TokenType.LESS_EQUAL, () => {
      checkNumberOperands(expr.operator, left, right);
      return left <= right;
    })
    .with(TokenType.EQUAL_EQUAL, () => isEqual(left, right))
    .with(TokenType.BANG_EQUAL, () => !isEqual(left, right))

    .otherwise(() => null);
}
function evaluate(expr: Expr): any {
  return match<Expr>(expr)
    .with({ type: "literal" }, visitLiteralExpr)
    .with({ type: "grouping" }, visitGroupingExpr)
    .with({ type: "binary" }, visitBinaryExpr)
    .with({ type: "unary" }, visitUnaryExpr)
    .exhaustive();
  // return interpret(expr);
}
function isTruthy(obj: any): boolean {
  if (obj === null) return false;
  if (typeof obj === "boolean") return obj;
  return true;
}
function isEqual(a: any, b: any): boolean {
  if (a === null && b === null) return true;
  if (a === null) return false;

  return a === b;
}
function checkNumberOperand(operator: Token, operand: any) {
  if (typeof operand === "number") return;
  const error: RuntimeError = {
    token: operator,
    message: "Operand must be a number",
  };
  throw error;
}
function checkNumberOperands(operator: Token, left: any, right: any) {
  if (typeof left === "number" && typeof right === "number") return;
  const error: RuntimeError = {
    token: operator,
    message: "Operands must be numbers",
  };
  throw error;
}
