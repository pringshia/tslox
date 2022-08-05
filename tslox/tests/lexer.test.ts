import { lexer } from "@lib/main";
import { isAlpha, isAlphaNumeric, isDigit } from "@lib/lexer";
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
  it("should work for numerical literals", () => {
    const source = "123";
    const tokens = lexer.getTokens(source);
    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(1);
    expect(tokens.result[0].literal).toBe(123);
  });
  it("should work for numerical literals with decimals", () => {
    const source = "123.12";
    const tokens = lexer.getTokens(source);
    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(1);
    expect(tokens.result[0].literal).toBe(123.12);
  });
  it("has the correct logic for alpha characters", () => {
    expect(isAlpha("a")).toBe(true);
    expect(isAlpha("A")).toBe(true);
    expect(isAlpha("_")).toBe(true);
    expect(isAlpha("-")).toBe(false);
    expect(isAlpha("1")).toBe(false);
  });
  it("has the correct logic for alphanumeric characters", () => {
    expect(isAlphaNumeric("a")).toBe(true);
    expect(isAlphaNumeric("A")).toBe(true);
    expect(isAlphaNumeric("_")).toBe(true);
    expect(isAlphaNumeric("-")).toBe(false);
    expect(isAlphaNumeric("1")).toBe(true);
  });
  it("has the correct logic for digits", () => {
    expect(isDigit("a")).toBe(false);
    expect(isDigit("A")).toBe(false);
    expect(isDigit("_")).toBe(false);
    expect(isDigit("-")).toBe(false);
    expect(isDigit("1")).toBe(true);
  });
  it("acknowledges reserved keywords", () => {
    const source = "for love and war";
    const tokens = lexer.getTokens(source);

    expect(
      tokens.result.filter((token) => token.type !== TokenType.EOF)
    ).toHaveLength(4);
    expect(tokens.result[0].type).toBe(TokenType.FOR);
    expect(tokens.result[1].type).toBe(TokenType.IDENTIFIER);
    expect(tokens.result[2].type).toBe(TokenType.AND);
    expect(tokens.result[3].type).toBe(TokenType.IDENTIFIER);
  });
});

export {};
