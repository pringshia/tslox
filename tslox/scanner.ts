export class Scanner {
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
  peekOneMore(): string {
    return this.source.charAt(this.current + 1);
  }
  newLine() {
    this.line++;
  }
  getLine() {
    return this.line;
  }
}
