import { Error } from "./error";
import { Token, TokenType, newToken } from "./tokens";
import { Response } from "./base";
import { match } from "ts-pattern";

class Scanner {
  source: string;
  start: number = 0;
  current: number = 0;
  line: number = 0;

  constructor(source: string) {
    this.source = source;
  }

  isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  startLexeme(): void {
    this.start = this.current;
  }
  currentLexeme(): string {
    return this.source.substring(this.start, this.current);
  }
  advance(): string {
    return this.source.charAt(this.current++);
  }
  advanceIf(expectedChar: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expectedChar) return false;

    this.advance();
    return true;
  }
  advanceToEndOrUntil(
    terminatingChar: string,
    callbackFn: (char: string) => void = () => {}
  ): void {
    while (this.peek() !== terminatingChar && !this.isAtEnd()) {
      callbackFn(this.peek());
      this.advance();
    }
  }
  peek(): string {
    return this.source.charAt(this.current);
  }
  newLine() {
    this.line++;
  }
  getLine() {
    return this.line;
  }
}

export function getTokens(source: string): Response<Token[]> {
  let tokens: Token[] = [];
  let errors: Error[] = [];
  const scanner = new Scanner(source);

  function createToken(type: TokenType, literal: any = null) {
    return {
      type,
      lexeme: scanner.currentLexeme(),
      literal,
      line: scanner.getLine(),
    };
  }

  while (!scanner.isAtEnd()) {
    scanner.startLexeme();
    const c = scanner.advance();
    const token = match(c)
      .with("(", () => createToken(TokenType.LEFT_PAREN))
      .with(")", () => createToken(TokenType.RIGHT_PAREN))
      .with("{", () => createToken(TokenType.LEFT_BRACE))
      .with("}", () => createToken(TokenType.RIGHT_BRACE))
      .with(",", () => createToken(TokenType.COMMA))
      .with(".", () => createToken(TokenType.DOT))
      .with("-", () => createToken(TokenType.MINUS))
      .with("+", () => createToken(TokenType.PLUS))
      .with(";", () => createToken(TokenType.SEMICOLON))
      .with("*", () => createToken(TokenType.STAR))
      .with("!", () =>
        scanner.advanceIf("=")
          ? createToken(TokenType.BANG_EQUAL)
          : createToken(TokenType.BANG)
      )
      .with("=", () =>
        scanner.advanceIf("=")
          ? createToken(TokenType.EQUAL_EQUAL)
          : createToken(TokenType.EQUAL)
      )
      .with("<", () =>
        scanner.advanceIf("=")
          ? createToken(TokenType.LESS_EQUAL)
          : createToken(TokenType.LESS)
      )
      .with(">", () =>
        scanner.advanceIf("=")
          ? createToken(TokenType.GREATER_EQUAL)
          : createToken(TokenType.GREATER)
      )
      .with("/", () => {
        if (scanner.advanceIf("/")) {
          // Read comment strings until the end of the line
          scanner.advanceToEndOrUntil("\n");
          return createToken(TokenType.IGNORE);
        } else {
          return createToken(TokenType.SLASH);
        }
      })
      .with('"', () => {
        scanner.advanceToEndOrUntil(
          '"',
          (char) => char === "\n" && scanner.newLine()
        );

        if (scanner.isAtEnd()) {
          return createToken(TokenType.INVALID, "Unterminated string.");
        }
        // Grab the closing quote
        scanner.advance();

        return createToken(
          TokenType.STRING,
          scanner.currentLexeme().slice(1, -1) // shave off the surrounding quotes
        );
      })
      .with(" ", () => createToken(TokenType.IGNORE))
      .with("\r", () => createToken(TokenType.IGNORE))
      .with("\t", () => createToken(TokenType.IGNORE))
      .with("\n", () => {
        scanner.newLine();
        return createToken(TokenType.IGNORE);
      })
      .otherwise(() =>
        createToken(
          TokenType.INVALID,
          `Unexpected character ${scanner.currentLexeme()}.`
        )
      );

    if (token.type === TokenType.INVALID) {
      errors.push({
        line: token.line,
        where: "",
        message: token.literal,
      });
    } else {
      tokens.push(token);
    }
  }
  tokens.push(newToken(TokenType.EOF, "", null, scanner.getLine()));

  return {
    result: tokens.filter((token) => token.type !== TokenType.IGNORE),
    errors: errors,
  };
}
