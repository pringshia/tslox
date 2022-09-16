import { RuntimeError } from "./error";
import { Token } from "./tokens";

export class Environment {
  values: Record<string, any> = {};
  enclosing: Environment | null = null;

  constructor(enclosing: Environment | null) {
    this.enclosing = enclosing;
  }

  define(name: string, value: any) {
    this.values[name] = value;
  }
  get(name: Token): any {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme];
    }
    if (this.enclosing !== null) return this.enclosing.get(name);

    const error: RuntimeError = {
      token: name,
      message: "Undefined variable '" + name.lexeme + "'.",
    };
    throw error;
  }
  assign(name: Token, value: any) {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
      return;
    }
    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }
    const error: RuntimeError = {
      token: name,
      message: "Undefined variable '" + name.lexeme + "'.",
    };
    throw error;
  }
}
