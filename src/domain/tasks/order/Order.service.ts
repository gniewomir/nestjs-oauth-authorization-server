import { IdentityValue } from "@domain/IdentityValue";
import { OrderInterface } from "@domain/tasks/order/Order.interface";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MIN = alphabet[0];
const MAX = alphabet[alphabet.length - 1];

function charAt(str: string, index: number, fallback: string): string {
  return index < str.length ? str[index] : fallback;
}

export class OrderService<T extends OrderInterface> {
  public static readonly START_ORDER_KEY = "U";

  constructor(private readonly entities: T) {}

  public async newOrderKey(assignedIdentity: IdentityValue): Promise<string> {
    const highest =
      await this.entities.searchForHighestOrderKey(assignedIdentity);
    return this.between(highest ?? undefined, undefined);
  }

  public async nextAvailableOrderKeyBefore(
    referenceIdentity: IdentityValue,
    assignedIdentity: IdentityValue,
  ): Promise<string> {
    const referenceKey = await this.entities.getOrderKey(referenceIdentity);
    const lowerKey = await this.entities.searchForLowerOrderKey(
      assignedIdentity,
      referenceKey,
    );
    return this.between(lowerKey ?? undefined, referenceKey);
  }

  public async nextAvailableOrderKeyAfter(
    referenceIdentity: IdentityValue,
    assignedIdentity: IdentityValue,
  ): Promise<string> {
    const referenceKey = await this.entities.getOrderKey(referenceIdentity);
    const higherKey = await this.entities.searchForHigherOrderKey(
      assignedIdentity,
      referenceKey,
    );
    return this.between(referenceKey, higherKey ?? undefined);
  }

  public between(a?: string, b?: string): string {
    const A = a ?? "";
    const B = b ?? "";
    let i = 0;
    let prefix = "";

    while (true) {
      const ca = charAt(A, i, MIN);
      const cb = charAt(B, i, MAX);

      if (ca === cb) {
        prefix += ca;
        i++;
        continue;
      }

      const ia = alphabet.indexOf(ca);
      const ib = alphabet.indexOf(cb);

      if (ib - ia > 1) {
        const midIndex = Math.floor((ia + ib) / 2);
        return prefix + alphabet[midIndex];
      }

      prefix += ca;
      i++;
    }
  }
}
