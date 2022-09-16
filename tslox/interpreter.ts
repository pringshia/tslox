import { Environment } from "./environment";
import { match, P } from "ts-pattern";
import {
  Binary,
  Grouping,
  Literal,
  Unary,
  Grammar,
  ExprGrammar,
  Expr,
  Stmt,
  PrintStmt,
  ExprStmt,
  VarStmt,
  Variable,
  Assignment,
  Block,
  IfStmt,
  Logical,
  WhileStmt,
} from "@lib/grammar";
import { Token, TokenType } from "@lib/tokens";
import { isRuntimeError, RuntimeError } from "@lib/error";
import { Response } from "@lib/base";

export class Interpreter {
  environment = new Environment(null);

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
      .with({ type: "variable" }, this.visitVariableExpr.bind(this))
      .with({ type: "assignment" }, this.visitAssignmentExpr.bind(this))
      .with({ type: "logical" }, this.visitLogicalExpr.bind(this))
      .with({ type: "printStmt" }, this.visitPrintStmt.bind(this))
      .with({ type: "exprStmt" }, this.visitExprStmt.bind(this))
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
