import { Expr } from "@lib/grammar";
import { match } from "ts-pattern";

export function ASTPrinter(expression: Expr) {
  function parenthesize(name: string, ...exprs: Expr[]) {
    let string = "(" + name;
    for (let expr of exprs) {
      string += " ";
      string += ASTPrinter(expr);
    }
    string += ")";
    return string;
  }

  return match<Expr>(expression)
    .with({ type: "literal" }, (expr) =>
      expr.value === null ? "nil" : expr.value.toString()
    )
    .with({ type: "grouping" }, (expr) =>
      parenthesize("group", expr.expression)
    )
    .with({ type: "binary" }, (expr) =>
      parenthesize(expr.operator.lexeme, expr.left, expr.right)
    )
    .with({ type: "unary" }, (expr) =>
      parenthesize(expr.operator.lexeme, expr.right)
    )
    .exhaustive();
}
