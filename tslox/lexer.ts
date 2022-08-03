type Token = {
  lexeme: string;
  literal?: string;
  line: number;
};

export function lexer(source: string): Token[] {
  // TODO: replace super naïve placeholder implementation below
  return source.split("\n").map((token) => ({
    lexeme: token,
    line: 0,
  }));
}
