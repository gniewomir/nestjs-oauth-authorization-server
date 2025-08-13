import { ClockInterface } from "@domain/Clock.interface";

export class ClockService implements ClockInterface {
  nowAsSecondsSinceEpoch(): number {
    return Math.floor(Date.now() / 1000);
  }

  nowAsMillisecondsSinceEpoch(): number {
    return Date.now();
  }
}
