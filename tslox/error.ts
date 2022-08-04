export type Error = {
  line: number;
  where: string;
  message: string;
};

export const ConsoleReporter = {
  report(err: Error) {
    console.error(err);
  },
};
