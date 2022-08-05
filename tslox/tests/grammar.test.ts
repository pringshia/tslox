import { newToken, TokenType } from "@lib/tokens";
import {
  Expr,
  newBinary,
  newGrouping,
  newLiteral,
  newUnary,
} from "@lib/grammar";
import { match } from "ts-pattern";
describe("Parser", () => {
  it("should parse correctly", () => {
    const expression: Expr = newBinary(
      newUnary(newToken(TokenType.MINUS, "-", null, 1), newLiteral(123)),
      newToken(TokenType.STAR, "*", null, 1),
      newGrouping(newLiteral(45.67))
    );

    // We'll define a one-off printer just for this test to convert a
    // a pre-defined AST into a string representation.
    function ASTPrinter(expression: Expr) {
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
    expect(ASTPrinter(expression)).toBe("(* (- 123) (group 45.67))");
  });
});

export {};
