import { match } from "ts-pattern";
import { Expr, Stmt, FunStmt, Variable, Assignment } from "./grammar";
import { Interpreter } from "./interpreter";
import { Token } from "./tokens";

enum FunctionType {
  NONE,
  FUNCTION,
}

export class Resolver {
  scopes: { [key: string]: boolean }[] = [];
  interpreter: Interpreter;
  currentFunction: FunctionType = FunctionType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }
  resolveTree(node: Expr | Stmt) {
    match<Expr | Stmt>(node)
      .with({ type: "block" }, (stmt) => {
        this.beginScope();
        this.resolveStmts(stmt.statements);
        this.endScope();
        return null;
      })
      .with({ type: "varStmt" }, (stmt) => {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
          this.resolveExpr(stmt.initializer);
        }
        this.define(stmt.name);
        return null;
      })
      .with({ type: "variable" }, (expr) => {
        if (this.scopes.length > 0) {
          const scope = this.scopes[this.scopes.length - 1];
          if (scope[expr.name.lexeme] === false) {
            this.error(
              expr.name,
              "Can't read a local variable in its own initializer."
            );
          }
        }
        this.resolveLocal(expr, expr.name);
        return null;
      })
      .with({ type: "assignment" }, (expr) => {
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name);
        return null;
      })
      .with({ type: "funStmt" }, (stmt) => {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, FunctionType.FUNCTION);
        return null;
      }) // and now the remaining:
      .with({ type: "exprStmt" }, (stmt) => {
        this.resolveExpr(stmt.expression);
        return null;
      })
      .with({ type: "ifStmt" }, (stmt) => {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch !== null) this.resolveStmt(stmt.elseBranch);
        return null;
      })
      .with({ type: "printStmt" }, (stmt) => {
        this.resolveExpr(stmt.expression);
        return null;
      })
      .with({ type: "returnStmt" }, (stmt) => {
        if (this.currentFunction === FunctionType.NONE) {
          this.error(stmt.keyword, "Can't return from top-level code.");
        }
        if (stmt.value !== null) {
          this.resolveExpr(stmt.value);
        }
        return null;
      })
      .with({ type: "whileStmt" }, (stmt) => {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.body);
        return null;
      })
      .with({ type: "binary" }, (expr) => {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
        return null;
      })
      .with({ type: "call" }, (expr) => {
        this.resolveExpr(expr.callee);
        for (const arg of expr.args) {
          this.resolveExpr(arg);
        }
        return null;
      })
      .with({ type: "grouping" }, (expr) => {
        this.resolveExpr(expr.expression);
        return null;
      })
      .with({ type: "literal" }, (expr) => {
        return null;
      })
      .with({ type: "noopStmt" }, (expr) => {
        return null;
      })
      .with({ type: "logical" }, (expr) => {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
        return null;
      })
      .with({ type: "unary" }, (expr) => {
        this.resolveExpr(expr.right);
        return null;
      })
      .exhaustive();
  }
  resolveFunction(fun: FunStmt, type: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of fun.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveStmts(fun.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }
  resolveLocal(expr: Variable | Assignment, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];
      if (name.lexeme in scope) {
        this.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
  resolveStmts(statements: Stmt[]) {
    for (const statement of statements) {
      this.resolveStmt(statement);
    }
  }
  resolveStmt(statement: Stmt) {
    this.resolveTree(statement);
  }
  resolveExpr(expression: Expr) {
    this.resolveTree(expression);
  }
  beginScope() {
    this.scopes.push({});
  }
  endScope() {
    this.scopes.pop();
  }
  declare(name: Token) {
    if (this.scopes.length === 0) return;
    const scope = this.scopes[this.scopes.length - 1];

    if (name.lexeme in scope) {
      this.error(
        name,
        "There's already a variable with this name in this scope."
      );
    }
    scope[name.lexeme] = false;
  }
  define(name: Token) {
    if (this.scopes.length === 0) return;
    const scope = this.scopes[this.scopes.length - 1];
    scope[name.lexeme] = true;
  }
  resolve(expr: Variable | Assignment, index: number) {
    this.interpreter.locals.set(expr, index);
  }
  error(token: Token, message: string) {
    console.error(token, message);
    throw { token, message };
  }
}
