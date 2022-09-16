import {
  Block,
  IfStmt,
  newAssignment,
  newBlock,
  newIfStmt,
  newLogical,
  newVariable,
  newWhileStmt,
  Variable,
  WhileStmt,
} from "./grammar";
import { Error, ParseError, isParseError } from "@lib/error";
import {
  Expr,
  Stmt,
  newBinary,
  newLiteral,
  newUnary,
  newGrouping,
  newPrintStmt,
  PrintStmt,
  newExprStmt,
  ExprStmt,
  newVarStmt,
  newNoopStmt,
} from "@lib/grammar";
import { Token, TokenType } from "@lib/tokens";
import { Response } from "@lib/base";

/*
expression     → equality ( "," equality )* ;
equality       → comparison ( ( "!=" | "==" ) comparison )* ;
comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term           → factor ( ( "-" | "+" ) factor )* ;
factor         → unary ( ( "/" | "*" ) unary )* ;
unary          → ( "!" | "-" ) unary
               | primary ;
primary        → NUMBER | STRING | "true" | "false" | "nil"
               | "(" expression ")" ;
*/
export class Parser {
  tokens: Token[] = [];
  current = 0;
  errorList: Error[] | undefined = undefined;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  read(): Response<Expr | null> {
    this.errorList = undefined;
    try {
      return {
        result: this.parseExpression(),
        errors: this.errorList,
      };
    } catch (error) {
      if (isParseError(error)) {
        return {
          result: null,
          errors: this.errorList,
        };
      } else {
        throw error;
      }
    }
  }
  parse(): Response<Stmt[] | null> {
    this.errorList = undefined;
    try {
      let statements: Stmt[] = [];
      while (!this.isAtEnd()) {
        const parsed = this.parseDeclaration();
        if (parsed.type !== "noopStmt") {
          statements.push(parsed);
        }
      }
      return {
        result: statements,
        errors: this.errorList,
      };
    } catch (error) {
      if (isParseError(error)) {
        return {
          result: null,
          errors: this.errorList,
        };
      } else {
        throw error;
      }
    }
  }
  parseDeclaration(): Stmt {
    try {
      if (this.match(TokenType.VAR)) return this.parseVarDeclaration();
      return this.parseStatement();
    } catch (error) {
      if (isParseError(error)) {
        this.synchronize();
      }
      return newNoopStmt();
    }
  }
  parseVarDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name.");
    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.parseExpression();
    }
    this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after variable declaration."
    );

    return newVarStmt(name, initializer);
  }
  parseStatement(): Stmt {
    if (this.match(TokenType.IF)) return this.parseIfStmt();
    if (this.match(TokenType.PRINT)) {
      return this.parsePrintStmt();
    }
    if (this.match(TokenType.WHILE)) {
      return this.parseWhileStmt();
    }
    if (this.match(TokenType.LEFT_BRACE)) {
      return newBlock(this.parseBlock());
    }
    return this.parseExprStmt();
  }
  parseBlock(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.parseDeclaration());
    }
    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");
    return statements;
  }
  parseWhileStmt(): WhileStmt {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
    const condition = this.parseExpression();
    this.consume(
      TokenType.RIGHT_PAREN,
      "Expected ')' after 'while' condition."
    );
    const body = this.parseStatement();

    return newWhileStmt(condition, body);
  }

  parseIfStmt(): IfStmt {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
    const condition = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'if' condition.");

    const thenBranch = this.parseStatement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.parseStatement();
    }
    return newIfStmt(condition, thenBranch, elseBranch);
  }
  parsePrintStmt(): PrintStmt {
    const val = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after value.");
    return newPrintStmt(val);
  }
  parseExprStmt(): ExprStmt {
    const val = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression.");
    return newExprStmt(val);
  }

  parseAssignment(): Expr {
    const expr = this.parseOr();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.parseAssignment();

      if (this.isVariable(expr)) {
        const name = expr.name;
        return newAssignment(name, value);
      }
      this.error(equals, "Invalid assignment target.");
    }
    return expr;
  }
  isVariable(expr: Expr): expr is Variable {
    return expr.type === "variable";
  }
  parseOr(): Expr {
    let expr = this.parseAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.parseAnd();
      expr = newLogical(expr, operator, right);
    }
    return expr;
  }
  parseAnd(): Expr {
    let expr = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.parseEquality();
      expr = newLogical(expr, operator, right);
    }
    return expr;
  }
  parseExpression(): Expr {
    if (this.match(TokenType.COMMA))
      throw this.error(
        this.previous(),
        "Expected expression before comma operator."
      );

    let expr = this.parseAssignment();

    while (this.match(TokenType.COMMA)) {
      let operator = this.previous();
      let right = this.parseAssignment();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseEquality(): Expr {
    if (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      throw this.error(
        this.previous(),
        "Expected comparable before equality operator."
      );
    }

    let expr = this.parseComparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      let operator = this.previous();
      let right = this.parseComparison();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseComparison(): Expr {
    if (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      throw this.error(
        this.previous(),
        "Expected term before comparison operator."
      );
    }

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
    if (this.match(TokenType.MINUS, TokenType.PLUS)) {
      throw this.error(this.previous(), "Expected operand before operator.");
    }

    let expr = this.parseFactor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      let operator = this.previous();
      let right = this.parseFactor();
      expr = newBinary(expr, operator, right);
    }
    return expr;
  }
  parseFactor(): Expr {
    if (this.match(TokenType.SLASH, TokenType.STAR)) {
      throw this.error(this.previous(), "Expected operand before operator.");
    }

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
    if (this.match(TokenType.IDENTIFIER)) return newVariable(this.previous());
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
    const error: ParseError = {
      line: token.line,
      where: token.type === TokenType.EOF ? "at end" : `at '${token.lexeme}'`,
      message,
    };
    if (!this.errorList) this.errorList = [];
    this.errorList.push(error);
    return error;
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
  synchronize(): void {
    this.advance();

    const newStatementKeywords = [
      TokenType.CLASS,
      TokenType.FUN,
      TokenType.VAR,
      TokenType.FOR,
      TokenType.IF,
      TokenType.WHILE,
      TokenType.PRINT,
      TokenType.RETURN,
    ];

    while (!this.isAtEnd()) {
      // discard until we reach an end of a statment, e.g. semicolon...
      if (this.previous().type === TokenType.SEMICOLON) {
        return;
      }
      // ...or a keyword that usually starts a new statement
      if (newStatementKeywords.includes(this.peek().type)) {
        return;
      }
      this.advance();
    }
  }
}

export function parse(tokens: Token[]) {
  return new Parser(tokens).parse();
}
