import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from './constant/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable CORS for your React frontend
  app.enableCors({
    origin: 'http://localhost:3001', // React dev server
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // if you want cookies or auth headers
  });


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