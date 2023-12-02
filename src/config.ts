import { ConfigModuleOptions } from '@nestjs/config';
import EnvConfigValidationSchema from './env-validation.schema';

const EnvConfig: ConfigModuleOptions = {
  validationSchema: EnvConfigValidationSchema,
  envFilePath: `.env.stage.${process.env.STAGE}`,
};

export { EnvConfig };
