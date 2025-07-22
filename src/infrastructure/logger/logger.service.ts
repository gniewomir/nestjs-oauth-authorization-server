import { ConsoleLogger, Injectable, Scope } from "@nestjs/common";
import { LoggerInterface } from "./logger.interface";

@Injectable({ scope: Scope.TRANSIENT }) // ensure every consumer gets fresh instance
export class LoggerService extends ConsoleLogger implements LoggerInterface {}
