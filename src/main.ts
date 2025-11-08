import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from './constant/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        // you can log or inspect `errors` here if needed
        return new BadRequestException('Bad Request');
      },
    }),
  );

  await app.listen(ENV.PORT);
}

bootstrap();