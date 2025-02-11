import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.GEOFFER_SPA_URL,
      credentials: true,
    },
  });
  await app.listen(3000);
}
bootstrap();
