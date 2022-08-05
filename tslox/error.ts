export type Error = {
  line: number;
  where: string;
  message: string;
};

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export const ConsoleReporter = {
  report(err: Error) {
    console.error(err);
  },
};
