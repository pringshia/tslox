import { newToken, TokenType } from "@lib/tokens";
import {
  Expr,
  newBinary,
  newGrouping,
  newLiteral,
  newUnary,
} from "@lib/grammar";
import { ASTPrinter } from "@lib/tests/utils";

describe("Parser", () => {
  it("should parse correctly", () => {
    const expression: Expr = newBinary(
      newUnary(newToken(TokenType.MINUS, "-", null, 1), newLiteral(123)),
      newToken(TokenType.STAR, "*", null, 1),
      newGrouping(newLiteral(45.67))
    );

    expect(ASTPrinter(expression)).toBe("(* (- 123) (group 45.67))");
  });
});

export {};
