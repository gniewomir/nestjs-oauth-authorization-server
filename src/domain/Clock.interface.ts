export interface ClockInterface {
  nowAsMillisecondsSinceEpoch(): number;

  nowAsSecondsSinceEpoch(): number;
}

export const ClockInterfaceSymbol = Symbol.for("ClockInterface");
