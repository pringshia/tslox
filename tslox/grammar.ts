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

export type Expr = Binary | Unary | Literal | Grouping;
export interface Grammar {}
export interface Binary {
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
  left,
  operator,
  right,
});
export interface Unary extends Grammar {
  type: "unary";
  operator: Token;
  right: Expr;
}
export const newUnary = (operator: Token, right: Expr): Unary => ({
  type: "unary",
  operator,
  right,
});
export interface Grouping extends Grammar {
  type: "grouping";
  expression: Expr;
}
export const newGrouping = (expression: Expr): Grouping => ({
  type: "grouping",
  expression,
});
export interface Literal extends Grammar {
  type: "literal";
  value: any;
}
export const newLiteral = (value: any): Literal => ({
  type: "literal",
  value,
});
