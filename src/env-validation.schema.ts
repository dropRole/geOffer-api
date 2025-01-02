import * as Joi from 'joi';

const EnvConfigValidationSchema: Joi.ObjectSchema = Joi.object({
  PORT: Joi.number().default(3000),
  PG_PORT: Joi.number().default(5432),
  PG_HOST: Joi.string().default('localhost'),
  PG_DATABASE: Joi.string().required(),
  PG_USERNAME: Joi.string().default('postgres'),
  PG_PASSWORD: Joi.string().default('postgres'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_HOST: Joi.string().default('localhost'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRE: Joi.number().required(),
  LOCATIONIQ_API_KEY: Joi.string().required(),
  AWS_S3_ACCESS_KEY: Joi.string().required(),
  AWS_S3_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_BUCKET_URL: Joi.string().required(),
});

export default EnvConfigValidationSchema;
