export interface ClockInterface {
  nowAsMillisecondsSinceEpoch(): number;

  nowAsSecondsSinceEpoch(): number;
}
