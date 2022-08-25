import { ASTPrinter } from "@lib/tests/utils";
import { getTokens } from "@lib/lexer";
import { Parser } from "@lib/parser";

describe("Parser", () => {
  it("should pass smoke test", () => {
    const source = "3 + (4 + 5) / 3";
    const { result: tokens } = getTokens(source);
    const { result: tree } = new Parser(tokens).parse();

    if (tree === null) {
      fail("Unexpected parse error");
    } else {
      expect(ASTPrinter(tree)).toEqual("(+ 3 (/ (group (+ 4 5)) 3))");
    }
  });
  it("should fail with error for unterminated parenthesis", () => {
    const source = "3 + (4 + 5 / 3";
    const { result: tokens } = getTokens(source);
    const { result: tree, errors: errors } = new Parser(tokens).parse();

    const error = errors && errors[0];

    if (error === null) {
      fail("Expected an error");
    } else {
      expect(error).toMatchObject({
        line: 0,
        where: "at end",
        message: "Expected ')' after expression.",
      });
    }
  });
  it("should fail with error for unexpected identifier", () => {
    const source = "3 + (4 + fun) / 3";
    const { result: tokens } = getTokens(source);
    const { result: tree, errors: errors } = new Parser(tokens).parse();

    const error = errors && errors[0];

    if (error === null) {
      fail("Expected an error");
    } else {
      expect(error).toMatchObject({
        line: 0,
        where: "at 'fun'",
        message: "Expected expression.",
      });
    }
  });
  it("should parse the comma operator", () => {
    const source = "3 + 4, 5 - 6, 1 + 3";
    const { result: tokens } = getTokens(source);
    const { result: tree } = new Parser(tokens).parse();

    if (tree === null) {
      fail("Unexpected parse error");
    } else {
      expect(ASTPrinter(tree)).toEqual("(, (, (+ 3 4) (- 5 6)) (+ 1 3))");
    }
  });
  it("should throw a predicted error when left-operand is missing in binary expression (addition)", () => {
    const source = "+ 5";
    const { result: tokens } = getTokens(source);
    const { result: tree, errors: errors } = new Parser(tokens).parse();

    if (!errors) {
      fail("Expected an error");
    } else {
      expect(errors[0].message).toBe("Expected operand before operator.");
    }
  });
  it("should throw a predicted error when left-operand is missing in binary expression (comma)", () => {
    const source = ", 5";
    const { result: tokens } = getTokens(source);
    const { result: tree, errors: errors } = new Parser(tokens).parse();

    if (!errors) {
      fail("Expected an error");
    } else {
      expect(errors[0].message).toBe(
        "Expected expression before comma operator."
      );
    }
  });
});
