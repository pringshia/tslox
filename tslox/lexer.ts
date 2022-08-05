import { match, P } from "ts-pattern";
import { Scanner } from "@lib/scanner";
import { Token, TokenType, newToken, ReservedKeyword } from "@lib/tokens";
import { Response } from "@lib/base";
import { Error } from "@lib/error";

export const isDigit = (c: string) => /\d/.test(c);
export const isAlpha = (c: string) => /[a-zA-Z_]/.test(c);
export const isAlphaNumeric = (c: string) => /[a-zA-Z_\d]/.test(c);

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

  const numericMatch = P.when<string, (value: string) => boolean>(isDigit);
  const alphaMatch = P.when<string, (value: string) => boolean>(isAlpha);

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
        scanner.advanceToEndOrUntil('"', (char) => {
          if (char === "\n") scanner.newLine();
        });

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
      .with(numericMatch, () => {
        while (isDigit(scanner.peek())) {
          scanner.advance();
        }
        if (scanner.peek() === "." && isDigit(scanner.peekOneMore())) {
          // Consume the "." decimal point
          scanner.advance();

          while (isDigit(scanner.peek())) {
            scanner.advance();
          }
        }
        return createToken(
          TokenType.NUMBER,
          parseFloat(scanner.currentLexeme())
        );
      })
      .with(alphaMatch, () => {
        while (isAlphaNumeric(scanner.peek())) {
          scanner.advance();
        }

        let tokenType;
        try {
          tokenType = match<ReservedKeyword>(
            scanner.currentLexeme() as ReservedKeyword
          )
            .with("and", () => TokenType.AND)
            .with("class", () => TokenType.CLASS)
            .with("else", () => TokenType.ELSE)
            .with("false", () => TokenType.FALSE)
            .with("fun", () => TokenType.FUN)
            .with("for", () => TokenType.FOR)
            .with("if", () => TokenType.IF)
            .with("nil", () => TokenType.NIL)
            .with("or", () => TokenType.OR)
            .with("print", () => TokenType.PRINT)
            .with("return", () => TokenType.RETURN)
            .with("super", () => TokenType.SUPER)
            .with("this", () => TokenType.THIS)
            .with("true", () => TokenType.TRUE)
            .with("var", () => TokenType.VAR)
            .with("while", () => TokenType.WHILE)
            .exhaustive();
        } catch {
          // WARNING: Possible performance hit here
          // This catch block is expected to be a pretty commonly traversed code path, and if we are
          // throwing for every identifier we encounter, there may be performance or other implications
          // worth exploring. The reason we use this approach is so that we can use .match().exhaustive()
          // above for the benefits of compile time type-safety, ensuring that we are covering all reserved keywords.
          // I am not a Typescript wizard just yet, so cannot come up with a non-try/catch solution just yet.
          tokenType = TokenType.IDENTIFIER;
        }

        return createToken(tokenType);
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
        where: "", // TODO implement
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
