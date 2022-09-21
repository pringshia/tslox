import { Environment } from "./environment";
import { match } from "ts-pattern";
import {
  Binary,
  Grouping,
  Literal,
  Unary,
  Expr,
  Stmt,
  PrintStmt,
  ExprStmt,
  FunStmt,
  ReturnStmt,
  VarStmt,
  Variable,
  Assignment,
  Block,
  IfStmt,
  Logical,
  WhileStmt,
  Call,
} from "@lib/grammar";
import { Token, TokenType } from "@lib/tokens";
import { isRuntimeError, RuntimeError } from "@lib/error";
import { Response } from "@lib/base";

interface Callable {
  type: "CallableFn";
  arity: () => number;
  call: (interpreter: Interpreter, args: any[]) => any;
  toString: () => string;
}
const createCallable = (
  arity: () => number,
  call: (interpreter: Interpreter, args: any[]) => any,
  toString: () => string
): Callable => {
  return {
    type: "CallableFn",
    arity,
    call,
    toString,
  };
};

class TSLoxFunction implements Callable {
  type: "CallableFn" = "CallableFn";
  declaration: FunStmt;
  closure: Environment;

  constructor(declaration: FunStmt, closure: Environment) {
    this.declaration = declaration;
    this.closure = closure;
  }
  arity() {
    return this.declaration.params.length;
  }
  call(interpreter: Interpreter, args: any[]) {
    const env = new Environment(this.closure);
    this.declaration.params.forEach((p, paramIndex) => {
      env.define(p.lexeme, args[paramIndex]);
    });
    try {
      interpreter.executeBlock(this.declaration.body, env);
    } catch (e) {
      if (isReturnException(e)) {
        return e.value;
      }
    }
    return null;
  }
  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}

type ReturnException = {
  type: "returnException";
  value: any;
};
const isReturnException = (e: any): e is ReturnException => {
  return e.type === "returnException";
};

export class Interpreter {
  globals = new Environment(null);
  environment = this.globals;

  constructor() {
    const clock: Callable = createCallable(
      () => 0,
      () => Date.now() / 1000,
      () => `<native fn>`
    );
    this.globals.define("clock", clock);
  }

  interpret(program: Stmt[]): Response<any> {
    const env = new Environment(null);
    try {
      for (const statement of program) {
        this.execute(statement);
      }
      return { result: null };
    } catch (error) {
      if (isRuntimeError(error)) {
        return { result: null, errors: [error] };
      } else {
        throw error;
      }
    }
  }

  evaluator(node: Expr | Stmt): Response<any> {
    try {
      const value = this.evaluate(node);
      return { result: value };
    } catch (error) {
      if (isRuntimeError(error)) {
        return { result: null, errors: [error] };
      } else {
        throw error;
      }
    }
  }

  stringify(obj: any): string {
    return match(obj)
      .with(null, () => "nil")
      .otherwise(() => "" + obj);
  }

  visitLiteralExpr(expr: Literal): any {
    return expr.value;
  }
  visitGroupingExpr(expr: Grouping): any {
    return this.evaluate(expr.expression);
  }
  visitUnaryExpr(expr: Unary): any {
    const right = this.evaluate(expr.right);
    return match(expr.operator.type)
      .with(TokenType.MINUS, () => {
        this.checkNumberOperand(expr.operator, right);
        return -1 * right;
      })
      .with(TokenType.BANG, () => !this.isTruthy(right))
      .otherwise(() => null);
  }
  visitBinaryExpr(expr: Binary): any {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    return match(expr.operator.type)
      .with(TokenType.MINUS, () => {
        this.checkNumberOperands(expr.operator, left, right);
        return left - right;
      })
      .with(TokenType.SLASH, () => {
        this.checkNumberOperands(expr.operator, left, right);
        return left / right;
      })
      .with(TokenType.STAR, () => {
        this.checkNumberOperands(expr.operator, left, right);
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
        this.checkNumberOperands(expr.operator, left, right);
        return left > right;
      })
      .with(TokenType.GREATER_EQUAL, () => {
        this.checkNumberOperands(expr.operator, left, right);
        return left >= right;
      })
      .with(TokenType.LESS, () => {
        this.checkNumberOperands(expr.operator, left, right);
        return left < right;
      })
      .with(TokenType.LESS_EQUAL, () => {
        this.checkNumberOperands(expr.operator, left, right);
        return left <= right;
      })
      .with(TokenType.EQUAL_EQUAL, () => this.isEqual(left, right))
      .with(TokenType.BANG_EQUAL, () => !this.isEqual(left, right))

      .otherwise(() => null);
  }
  visitCallExpr(expr: Call): any {
    const callee = this.evaluate(expr.callee) as Callable;
    const evaledArgs = expr.args.map(this.evaluate.bind(this));

    if (callee.type !== "CallableFn") {
      const error: RuntimeError = {
        token: expr.closingParen,
        message: "Can only call functions and classes.",
      };
      throw error;
    }
    if (expr.args.length !== callee.arity()) {
      const error: RuntimeError = {
        token: expr.closingParen,
        message: `Expected ${callee.arity()} argument(s) but got ${
          expr.args.length
        }.`,
      };
      throw error;
    }
    return callee.call(this, evaledArgs);
  }
  visitVariableExpr(expr: Variable): any {
    return this.environment.get(expr.name);
  }
  visitAssignmentExpr(expr: Assignment): any {
    const val = this.evaluate(expr.value);
    this.environment.assign(expr.name, val);
    return val;
  }
  visitLogicalExpr(expr: Logical): any {
    const left = this.evaluate(expr.left);
    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else if (expr.operator.type === TokenType.AND) {
      if (!this.isTruthy(left)) return left;
    }
    return this.evaluate(expr.right);
  }
  visitPrintStmt(stmt: PrintStmt): void {
    const val = this.evaluate(stmt.expression);
    console.log(this.stringify(val));
  }
  visitExprStmt(stmt: ExprStmt): void {
    this.evaluate(stmt.expression);
    return;
  }
  visitVarStmt(stmt: VarStmt): void {
    let val = null;
    if (stmt.initializer !== null) {
      val = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, val);
    return;
  }
  visitFunStmt(stmt: FunStmt): void {
    const fn = new TSLoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fn);
    return;
  }
  visitReturnStmt(stmt: ReturnStmt): void {
    let value = stmt.value !== null ? this.evaluate(stmt.value) : null;
    const ret: ReturnException = {
      type: "returnException",
      value,
    };
    throw ret;
  }
  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
    return;
  }
  visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return;
  }
  visitBlock(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return;
  }

  execute(node: Stmt): any {
    return this.evaluate(node);
  }
  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }
  evaluate(node: Expr | Stmt): any {
    return match<Expr | Stmt>(node)
      .with({ type: "literal" }, this.visitLiteralExpr.bind(this))
      .with({ type: "grouping" }, this.visitGroupingExpr.bind(this))
      .with({ type: "binary" }, this.visitBinaryExpr.bind(this))
      .with({ type: "unary" }, this.visitUnaryExpr.bind(this))
      .with({ type: "call" }, this.visitCallExpr.bind(this))
      .with({ type: "variable" }, this.visitVariableExpr.bind(this))
      .with({ type: "assignment" }, this.visitAssignmentExpr.bind(this))
      .with({ type: "logical" }, this.visitLogicalExpr.bind(this))
      .with({ type: "printStmt" }, this.visitPrintStmt.bind(this))
      .with({ type: "exprStmt" }, this.visitExprStmt.bind(this))
      .with({ type: "funStmt" }, this.visitFunStmt.bind(this))
      .with({ type: "returnStmt" }, this.visitReturnStmt.bind(this))
      .with({ type: "varStmt" }, this.visitVarStmt.bind(this))
      .with({ type: "block" }, this.visitBlock.bind(this))
      .with({ type: "ifStmt" }, this.visitIfStmt.bind(this))
      .with({ type: "whileStmt" }, this.visitWhileStmt.bind(this))
      .with({ type: "noopStmt" }, () => {})
      .exhaustive();
    // return interpret(expr);
  }
  isTruthy(obj: any): boolean {
    if (obj === null) return false;
    if (typeof obj === "boolean") return obj;
    return true;
  }
  isEqual(a: any, b: any): boolean {
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }
  checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand === "number") return;
    const error: RuntimeError = {
      token: operator,
      message: "Operand must be a number",
    };
    throw error;
  }
  checkNumberOperands(operator: Token, left: any, right: any) {
    if (typeof left === "number" && typeof right === "number") return;
    const error: RuntimeError = {
      token: operator,
      message: "Operands must be numbers",
    };
    throw error;
  }
}
