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

  update(type: string, key: string, verbose?: string): void {
    super.log(
      `DATA | ${type} instance identified with ${key} was updated at ${new Date().toLocaleString()} (${verbose}).`,
    );
  }

  delete(type: string, key: string): void {
    super.log(
      `DATA | ${type} instance with identifier ${key} was deleted at ${new Date().toLocaleString()}.`,
    );
  }

  error(message: string): void {
    super.error(`DATA | ${new Date().toLocaleString()} ${message} `);
  }
}
