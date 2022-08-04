import { lexer } from "@lib/main";
import { TokenType } from "@lib/tokens";

describe("Lexer", () => {
  it("should not tokenize lexemes at the end of a comment WITH newline", () => {
    // This test was added to reproduce a bug that was caused by Scanner.peek() accidentally
    // looking at the next character instead of the current one (off-by-1 error).
    const source = "//.\n";
    const tokens = lexer.getTokens(source);
    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(0);
  });
  it("should not tokenize lexemes at the end of a comment WITHOUT newline", () => {
    // This test was added to reproduce a bug that was caused by Scanner.peek() accidentally
    // looking at the next character instead of the current one (off-by-1 error). This test
    // was suprisingly passing with the bug, while the previous one WITH newline was failing.
    const source = "//.";
    const tokens = lexer.getTokens(source);
    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(0);
  });
  it("should work with three slashes", () => {
    const source = "///";
    const tokens = lexer.getTokens(source);
    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(0);
  });
  it("should work for string literals", () => {
    const source = '"test"';
    const tokens = lexer.getTokens(source);
    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(1);
    expect(tokens.result[0].literal).toEqual("test");
  });
  it("should yield an error for unexpected characters", () => {
    const source = "#";
    const tokens = lexer.getTokens(source);
    expect(tokens.errors).toHaveLength(1);
    if (tokens["errors"]) {
      expect(tokens.errors[0].message).toMatch(/Unexpected character/);
    } else {
      fail("An error should have been reported");
    }
  });
  it("should yield an error for unterminated strings", () => {
    const source = '"this is an unterminated string';
    const tokens = lexer.getTokens(source);
    expect(tokens.errors).toHaveLength(1);
    if (tokens["errors"]) {
      expect(tokens.errors[0].message).toMatch(/Unterminated string/);
    } else {
      fail("An error should have been reported");
    }
  });
});

export {};
