import { ClockInterface } from "@domain/Clock.interface";

export class ClockServiceFake implements ClockInterface {
  private now: number = 0;

  nowAsMillisecondsSinceEpoch(): number {
    return this.now === 0 ? Date.now() : this.now;
  }

  nowAsSecondsSinceEpoch(): number {
    return this.now === 0
      ? Math.floor(Date.now() / 1000)
      : Math.floor(this.now / 1000);
  }

  timeTravelMs(millisecondsSinceEpoch: number) {
    this.now = millisecondsSinceEpoch;
  }

  timeTravelSeconds(secondsSinceEpoch: number) {
    this.timeTravelMs(secondsSinceEpoch * 1000);
  }

  returnToPresent() {
    this.now = 0;
  }
}
