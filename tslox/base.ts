import { Error } from "./error";

export type Response<T> = {
  result: T;
  errors?: Error[];
};
