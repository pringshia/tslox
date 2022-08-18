export type Error = {
  line: number;
  where: string;
  message: string;
};

export type ParseError = Error;

// Typeguard function
export function isError(err: any): err is Error {
  return "line" in err && "message" in err && "where" in err;
}

export const ConsoleReporter = {
  report(err: Error) {
    console.error(err);
  },
};
