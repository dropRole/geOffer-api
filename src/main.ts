import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.GEOFFER_SPA_URL,
      credentials: true,
    },
  });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
