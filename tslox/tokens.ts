export type Token = {
  type: TokenType;
  lexeme: string;
  literal: any;
  line: number;
};

export enum TokenType {
  // Note: By default, Typescript enums implicity get assigned autoincrementing numbers.
  // The way this gets typed, means that we can provide any number to a function taking the enum as parameter.
  // This sort of breaks the `.exhaustive()` method in the `ts-pattern` library.
  //
  // Luckily, this isn't the case for enums with string values, which is why we assign string values below.
  // This approach allows the enum to work with the `.exhaustive()` method in the `ts-pattern` library.
  //
  // References:
  // https://github.com/microsoft/TypeScript/issues/46562
  // https://github.com/gvergnaud/ts-pattern/issues/58

  // Always one character tokens:
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  LEFT_BRACE = "LEFT_BRACE",
  RIGHT_BRACE = "RIGHT_BRACE",
  COMMA = "COMMA",
  DOT = "DOT",
  MINUS = "MINUS",
  PLUS = "PLUS",
  SEMICOLON = "SEMICOLON",
  SLASH = "SLASH",
  STAR = "STAR",

  // Potentially one or two character tokens:
  BANG = "BANG",
  BANG_EQUAL = "BANG_EQUAL",
  EQUAL = "EQUAL",
  EQUAL_EQUAL = "EQUAL_EQUAL",
  GREATER = "GREATER",
  GREATER_EQUAL = "GREATER_EQUAL",
  LESS = "LESS",
  LESS_EQUAL = "LESS_EQUAL",

  // Literals:
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",

  // Keywords:
  AND = "AND",
  CLASS = "CLASS",
  ELSE = "ELSE",
  FALSE = "FALSE",
  FUN = "FUN",
  FOR = "FOR",
  IF = "IF",
  NIL = "NIL",
  OR = "OR",
  PRINT = "PRINT",
  RETURN = "RETURN",
  SUPER = "SUPER",
  THIS = "THIS",
  TRUE = "TRUE",
  VAR = "VAR",
  WHILE = "WHILE",

  EOF = "EOF",
  IGNORE = "IGNORE",
  INVALID = "INVALID",
}

export type ReservedKeyword =
  | "and"
  | "class"
  | "else"
  | "false"
  | "fun"
  | "for"
  | "if"
  | "nil"
  | "or"
  | "print"
  | "return"
  | "super"
  | "this"
  | "true"
  | "var"
  | "while";

export function newToken(
  type: TokenType,
  lexeme: string,
  literal: any,
  line: number
): Token {
  return {
    type,
    lexeme,
    literal,
    line,
  };
}
