import { Token } from "@lib/tokens";

export type ParseError = {
  line: number;
  where: string;
  message: string;
};

export type RuntimeError = {
  token: Token;
  message: string;
};

export type Error = ParseError | RuntimeError;

// Typeguard functions
export function isParseError(err: any): err is ParseError {
  return "line" in err && "message" in err && "where" in err;
}
export function isRuntimeError(err: any): err is RuntimeError {
  return "token" in err && "message" in err;
}

export const ConsoleReporter = {
  report(err: Error) {
    console.error(err);
  },
};
