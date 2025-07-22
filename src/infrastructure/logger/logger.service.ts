import { ConsoleLogger, Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.TRANSIENT }) // ensure every consumer gets fresh instance
export class LoggerService extends ConsoleLogger {}
