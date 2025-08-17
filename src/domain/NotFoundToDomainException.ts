import { NotFoundException } from "@infrastructure/repositories/NotFoundException";

export async function NotFoundToDomainException<T>(
  callback: () => Promise<T>,
  errorFactory: (error: Error) => any,
): Promise<T> {
  try {
    return await callback();
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw errorFactory(error);
    }
    throw error;
  }
}
