import { executeProgram, readEval } from "@lib/main";
import { getTokens } from "@lib/lexer";
import { Parser } from "@lib/parser";
import { Interpreter } from "@lib/interpreter";

describe("Interpreter for expressions", () => {
  it("should pass smoke test", () => {
    const source = "3 + (4 + 5) / 3;";
    const { result: tokens } = getTokens(source);
    const { result: tree } = new Parser(tokens).read();
    if (tree == null) {
      fail("Error parsing tree");
    } else {
      const { result } = new Interpreter().evaluator(tree);
      expect(result).toBe(6);
    }
  });
  it("should work with execute command", () => {
    expect(readEval("3 + 5 * 3").result).toBe(18);
  });
  it("should throw an error for unimplemented syntax", () => {
    expect(
      readEval(`fun add(a, b) {
      return a + b;
    }`).errors?.length
    ).toBeGreaterThan(0);
  });
});

describe("Interpreter for programs", () => {
  it("should complain for no semicolons", () => {
    const logSpy = jest.spyOn(console, "log");
    const reportError = jest.fn();
    const out = executeProgram("print 5", (err) => reportError(err));
    expect(out && out.result).not.toBeTruthy();
    expect(reportError).toBeCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });
  it("should print for print statments", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const out = executeProgram("print 5;", (err) => console.error(err));
    expect(out && out.result).not.toBeTruthy();
    expect(logSpy).toHaveBeenCalledWith("5");
    logSpy.mockRestore();
  });
  it("should work for multiple statements", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    executeProgram(`print "one";
    print true;
    print 2 + 1;`);
    expect(logSpy).toHaveBeenCalledTimes(3);
    logSpy.mockRestore();
  });
});

describe("Global variables", () => {
  it("should pass the smoke test", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    executeProgram(`var beverage = "espresso"; print beverage;`, (err) =>
      console.error(err)
    );
    expect(logSpy).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });
  it("should print what's expected", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const { ast } = executeProgram(
      `
    var a = 1;
    var b = 2;
    print a + b;
    `,
      (err) => console.error(err)
    );
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("3");
    logSpy.mockRestore();
  });
  it("should error during reference if not declared", () => {
    const reportError = jest.fn();
    const out = executeProgram(
      `
    print name;
    `,
      (err) => reportError(err)
    );
    expect(reportError).toBeCalled();
  });
  it("should error during assignment if not declared", () => {
    const reportError = jest.fn();
    const out = executeProgram(
      `
    name = "Bob";
    `,
      (err) => reportError(err)
    );
    expect(reportError).toBeCalled();
  });
  it("should allow for reassignment", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
    var name = "Bob";
    print name;
    name = "Arpit";
    print name;
    `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    expect(logSpy).toHaveBeenNthCalledWith(1, "Bob");
    expect(logSpy).toHaveBeenNthCalledWith(2, "Arpit");
    logSpy.mockRestore();
  });
});
describe("Managing scope", () => {
  it("should pass the smoke test", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
      var a = "global a";
      var b = "global b";
      var c = "global c";
      {
        var a = "outer a";
        var b = "outer b";
        {
          var a = "inner a";
          print a;
          print b;
          print c;
        }
        print a;
        print b;
        print c;
      }
      print a;
      print b;
      print c;
    `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    const expectedResults = [
      "inner a",
      "outer b",
      "global c",
      "outer a",
      "outer b",
      "global c",
      "global a",
      "global b",
      "global c",
    ];
    for (const [i, expectedResult] of expectedResults.entries()) {
      expect(logSpy).toHaveBeenNthCalledWith(i + 1, expectedResult);
    }
    logSpy.mockRestore();
  });
});
describe("Logical operators", () => {
  it("should return the proper terms", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
      print "hi" or 2;
      print nil or "yes";
    `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    const expectedResults = ["hi", "yes"];
    for (const [i, expectedResult] of expectedResults.entries()) {
      expect(logSpy).toHaveBeenNthCalledWith(i + 1, expectedResult);
    }
    logSpy.mockRestore();
  });
  describe("While loops", () => {
    it("should loop accordingly", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();
      const reportError = jest.fn();
      const out = executeProgram(
        `
        var i = 0;
        while (i < 3) {
          print i;
          i = i + 1;
        }
      `,
        (err) => reportError(err)
      );
      expect(reportError).not.toBeCalled();
      const expectedResults = ["0", "1", "2"];
      for (const [i, expectedResult] of expectedResults.entries()) {
        expect(logSpy).toHaveBeenNthCalledWith(i + 1, expectedResult);
      }
      logSpy.mockRestore();
    });
  });
  describe("For loops", () => {
    it("should print out the Fibbonaci sequence", () => {
      const logSpy = jest.spyOn(console, "log"); /*.mockImplementation();*/
      const reportError = jest.fn();
      const out = executeProgram(
        `
        var a = 0;
        var temp;
        
        for (var b = 1; a < 10000; b = temp + b) {
          print a;
          temp = a;
          a = b;
        }      `,
        (err) => reportError(err)
      );
      expect(reportError).not.toBeCalled();
      const expectedResults = [
        "0",
        "1",
        "1",
        "2",
        "3",
        "5",
        "8",
        "13",
        "21",
        "34",
        "55",
        "89",
        "144",
        "233",
        "377",
        "610",
        "987",
        "1597",
        "2584",
        "4181",
        "6765",
      ];
      for (const [i, expectedResult] of expectedResults.entries()) {
        expect(logSpy).toHaveBeenNthCalledWith(i + 1, expectedResult);
      }
      logSpy.mockRestore();
    });
  });
});
describe("Functions", () => {
  it("should pass the smoke test", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
      fun sayHi(first, last) {
        print "Hi, " + first + " " + last + "!";
      }
      sayHi("Dear", "Reader");
    `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    expect(logSpy).toHaveBeenCalledWith("Hi, Dear Reader!");
    logSpy.mockRestore();
  });
  it("should be able to recursively calculate Fibonacci numbers", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
      fun fib(n) {
        if (n <= 1) return n;
        return fib(n - 2) + fib(n - 1);
      }
      
      for (var i = 0; i < 20; i = i + 1) {
        print fib(i);
      }    `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    const expectedResults = [
      "0",
      "1",
      "1",
      "2",
      "3",
      "5",
      "8",
      "13",
      "21",
      "34",
      "55",
      "89",
      "144",
      "233",
      "377",
      "610",
      "987",
      "1597",
      "2584",
      "4181",
    ];
    for (const [i, expectedResult] of expectedResults.entries()) {
      expect(logSpy).toHaveBeenNthCalledWith(i + 1, expectedResult);
    }
    logSpy.mockRestore();
  });
  it("supports closures", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const reportError = jest.fn();
    const out = executeProgram(
      `
      fun makeCounter() {
        var i = 0;
        fun count() {
          i = i + 1;
          print i;
        }
      
        return count;
      }
      
      var counter = makeCounter();
      counter();
      counter();
          `,
      (err) => reportError(err)
    );
    expect(reportError).not.toBeCalled();
    expect(logSpy).toHaveBeenNthCalledWith(1, "1");
    expect(logSpy).toHaveBeenNthCalledWith(2, "2");
    logSpy.mockRestore();
  });
});
