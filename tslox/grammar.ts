import { Token } from "@lib/tokens";

/*
expression     → literal
               | unary
               | binary
               | grouping ;

literal        → NUMBER | STRING | "true" | "false" | "nil" ;
grouping       → "(" expression ")" ;
unary          → ( "-" | "!" ) expression ;
binary         → expression operator expression ;
operator       → "==" | "!=" | "<" | "<=" | ">" | ">="
               | "+"  | "-"  | "*" | "/" ;
*/

export type Expr =
  | Binary
  | Unary
  | Literal
  | Call
  | Grouping
  | Variable
  | Assignment
  | Logical;
export type Stmt =
  | ExprStmt
  | PrintStmt
  | VarStmt
  | FunStmt
  | ReturnStmt
  | NoopStmt
  | IfStmt
  | WhileStmt
  | Block;
export type ExprGrammar = {
  kind: "expr";
};
export type StmtGrammar = {
  kind: "stmt";
};
export type Grammar = ExprGrammar | StmtGrammar;

// export function expr<T extends Expr>(value: T): ExprType {
//   return {
//     kind: "expr",
//     ...value,
//   };
// }
export interface Assignment extends ExprGrammar {
  type: "assignment";
  value: Expr;
  name: Token;
}
export const newAssignment = (name: Token, value: Expr): Assignment => ({
  type: "assignment",
  kind: "expr",
  value,
  name,
});

export interface Binary extends ExprGrammar {
  type: "binary";
  left: Expr;
  right: Expr;
  operator: Token;
}
export const newBinary = (
  left: Expr,
  operator: Token,
  right: Expr
): Binary => ({
  type: "binary",
  kind: "expr",
  left,
  operator,
  right,
});
export interface Unary extends ExprGrammar {
  type: "unary";
  operator: Token;
  right: Expr;
}
export const newUnary = (operator: Token, right: Expr): Unary => ({
  type: "unary",
  kind: "expr",
  operator,
  right,
});
export interface Call extends ExprGrammar {
  type: "call";
  callee: Expr;
  closingParen: Token;
  args: Expr[];
}
export const newCall = (
  callee: Expr,
  closingParen: Token,
  args: Expr[]
): Call => ({
  type: "call",
  kind: "expr",
  callee,
  closingParen,
  args,
});
export interface Grouping extends ExprGrammar {
  type: "grouping";
  expression: Expr;
}
export const newGrouping = (expression: Expr): Grouping => ({
  type: "grouping",
  kind: "expr",
  expression,
});
export interface Literal extends ExprGrammar {
  type: "literal";
  value: any;
}
export const newLiteral = (value: any): Literal => ({
  type: "literal",
  kind: "expr",
  value,
});
export interface Variable extends ExprGrammar {
  type: "variable";
  name: Token;
}
export const newVariable = (name: Token): Variable => ({
  type: "variable",
  kind: "expr",
  name,
});
export interface Logical extends ExprGrammar {
  type: "logical";
  left: Expr;
  operator: Token;
  right: Expr;
}
export const newLogical = (
  left: Expr,
  operator: Token,
  right: Expr
): Logical => ({
  type: "logical",
  kind: "expr",
  left,
  operator,
  right,
});

export interface PrintStmt extends StmtGrammar {
  type: "printStmt";
  expression: Expr;
}
export const newPrintStmt = (expression: Expr): PrintStmt => ({
  type: "printStmt",
  kind: "stmt",
  expression,
});
export interface ExprStmt extends StmtGrammar {
  type: "exprStmt";
  expression: Expr;
}
export const newExprStmt = (expression: Expr): ExprStmt => ({
  type: "exprStmt",
  kind: "stmt",
  expression,
});
export interface VarStmt extends StmtGrammar {
  type: "varStmt";
  name: Token;
  initializer: Expr | null;
}
export const newVarStmt = (name: Token, initializer: Expr | null): VarStmt => ({
  type: "varStmt",
  kind: "stmt",
  name,
  initializer,
});
export interface FunStmt extends StmtGrammar {
  type: "funStmt";
  name: Token;
  params: Token[];
  body: Stmt[];
}
export const newFunStmt = (
  name: Token,
  params: Token[],
  body: Stmt[]
): FunStmt => ({
  type: "funStmt",
  kind: "stmt",
  name,
  params,
  body,
});
export interface ReturnStmt extends StmtGrammar {
  type: "returnStmt";
  keyword: Token;
  value: Expr | null;
}
export const newReturnStmt = (
  keyword: Token,
  value: Expr | null
): ReturnStmt => ({
  type: "returnStmt",
  kind: "stmt",
  keyword,
  value,
});
export interface NoopStmt extends StmtGrammar {
  type: "noopStmt";
}
export const newNoopStmt = (): NoopStmt => ({
  type: "noopStmt",
  kind: "stmt",
});
export interface Block extends StmtGrammar {
  type: "block";
  statements: Stmt[];
}
export const newBlock = (statements: Stmt[]): Block => ({
  type: "block",
  kind: "stmt",
  statements,
});
export interface IfStmt extends StmtGrammar {
  type: "ifStmt";
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
}
export const newIfStmt = (
  condition: Expr,
  thenBranch: Stmt,
  elseBranch: Stmt | null
): IfStmt => ({
  type: "ifStmt",
  kind: "stmt",
  condition,
  thenBranch,
  elseBranch,
});
export interface WhileStmt extends StmtGrammar {
  type: "whileStmt";
  condition: Expr;
  body: Stmt;
}
export const newWhileStmt = (condition: Expr, body: Stmt): WhileStmt => ({
  type: "whileStmt",
  kind: "stmt",
  condition,
  body,
});
