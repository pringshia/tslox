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
  getAt(distance: number, name: string): any {
    return this.ancestor(distance || 0).values[name];
  }
  assignAt(distance: number, name: Token, val: any) {
    this.ancestor(distance).values[name.lexeme] = val;
  }
  ancestor(distance: number): Environment {
    let env: Environment = this;
    for (let i = 0; i < distance; i++) {
      env = env?.enclosing!; // we are taking a leap of faith here, assuming the resolver did its job correctly
    }
    return env;
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
