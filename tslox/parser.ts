import { Error, ParseError } from "@lib/error";
import {
  Expr,
  newBinary,
  newLiteral,
  newUnary,
  newGrouping,
} from "@lib/grammar";
import { Token, TokenType } from "@lib/tokens";
import { Response } from "@lib/base";
export class Parser {
  tokens: Token[] = [];
  current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  parse(): Response<Expr | null> {
    try {
      return {
        result: this.parseExpression(),
      };
    } catch (error) {
      if (this.isError(error)) {
        return {
          result: null,
          errors: [error],
        };
      } else {
        throw error;
      }
    }
  }

  // Typeguard function
  isError(err: any): err is Error {
    return "line" in err && "message" in err && "where" in err;
  }

  parseExpression(): Expr {
    return this.parseEquality();
  }
  parseEquality(): Expr {
    let expr = this.parseComparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      let operator = this.previous();
      let right = this.parseComparison();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseComparison(): Expr {
    let expr = this.parseTerm();
    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      let operator = this.previous();
      let right = this.parseTerm();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseTerm(): Expr {
    let expr = this.parseFactor();
    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      let operator = this.previous();
      let right = this.parseFactor();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseFactor(): Expr {
    let expr = this.parseUnary();
    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      let operator = this.previous();
      let right = this.parseUnary();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseUnary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      let operator = this.previous();
      let right = this.parseUnary();
      return newUnary(operator, right);
    } else {
      return this.parsePrimary();
    }
  }
  parsePrimary(): Expr {
    if (this.match(TokenType.FALSE)) return newLiteral(false);
    if (this.match(TokenType.TRUE)) return newLiteral(true);
    if (this.match(TokenType.NIL)) return newLiteral(null);
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return newLiteral(this.previous().literal);
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      let expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
      return newGrouping(expr);
    }
    throw this.error(this.peek(), "Expected expression.");
  }
  consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }
  error(token: Token, message: string) {
    const error: Error = {
      line: token.line,
      where: token.type === TokenType.EOF ? "at end" : `at '${token.lexeme}'`,
      message,
    };
    throw error;
  }
  previous(): Token {
    return this.tokens[this.current - 1];
  }
  match(...types: TokenType[]): boolean {
    for (let type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }
  check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }
  isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
  peek(): Token {
    return this.tokens[this.current];
  }
}

export function parse(tokens: Token[]) {
  return new Parser(tokens).parse();
}
