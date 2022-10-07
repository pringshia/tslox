import { executeProgram, readEval } from "@lib/main";
import { getTokens } from "@lib/lexer";
import { Parser } from "@lib/parser";
import { Interpreter } from "@lib/interpreter";

describe("Resolver", () => {
  it("should freeze reference to global variable", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
      var a = "global";
      {
        fun showA() {
          print a;
        }
      
        showA();
        var a = "block";
        showA();
      }        `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    const expectedResults = ["global", "global"];
    for (const [i, expectedResult] of expectedResults.entries()) {
      expect(logSpy).toHaveBeenNthCalledWith(i + 1, expectedResult);
    }
    logSpy.mockRestore();
  });
});
