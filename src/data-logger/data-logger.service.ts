import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class DataLoggerService extends ConsoleLogger {
  constructor() {
    super();
  }

  create(type: string, key: string): void {
    super.log(
      `DATA | ${type} instance identified with ${key} was created at ${new Date().toLocaleString()}.`,
    );
  }

  read(type: string, take: number): void {
    super.log(
      `DATA | ${take + ' ' + type} ${
        take > 1 ? 'instances were' : 'instance was'
      } read at ${new Date().toLocaleString()}.`,
    );
  }

  update(type: string, key: string, verbose?: string): void {
    super.log(
      `DATA | ${type} instance identified with ${key} was updated at ${new Date().toLocaleString()} (${verbose}).`,
    );
  }

  delete(type: string, take: number): void {
    super.log(
      `DATA | ${take + ' ' + type} ${
        take > 1 ? 'instances were' : 'instance was'
      } deleted at ${new Date().toLocaleString()}.`,
    );
  }
}
