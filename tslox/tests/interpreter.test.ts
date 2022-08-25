import { ASTPrinter } from "@lib/tests/utils";
import { getTokens } from "@lib/lexer";
import { Parser } from "@lib/parser";
import { interpret } from "@lib/interpreter";

describe("Interpreter", () => {
  it("should pass smoke test", () => {
    const source = "3 + (4 + 5) / 3";
    const { result: tokens } = getTokens(source);
    const { result: tree } = new Parser(tokens).parse();
    if (tree == null) {
      fail("Error parsing tree");
    } else {
      const { result } = interpret(tree);
      expect(result).toBe(6);
    }
  });
});
