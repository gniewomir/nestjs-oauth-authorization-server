import { DatabaseNotFoundException } from "@infrastructure/repositories/DatabaseNotFoundException";

export async function NotFoundToDomainException<T>(
  callback: () => Promise<T>,
  errorFactory: (error: Error) => Error,
): Promise<T> {
  try {
    return await callback();
  } catch (error) {
    if (error instanceof DatabaseNotFoundException) {
      throw errorFactory(error);
    }
    throw error;
  }
}
