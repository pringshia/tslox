import { Error } from "@lib/error";

export type Response<T> = {
  result: T;
  errors?: Error[];
};
