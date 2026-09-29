import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // CORS limited to an explicit allowlist (never reflect arbitrary origins).
  const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8080').split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: true });
  // Validate + strip every request body; reject unknown fields (no mass assignment).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();
  // API_PORT wins over PORT. In dev BOTH processes see the same PORT (the platform's preview
  // runtime exports one for the web server), and the API would bind the port Next already has:
  // "EADDRINUSE: address already in use :::3000", API dead, every page 500s on its data.
  await app.listen(Number(process.env.API_PORT ?? process.env.PORT ?? 8080));
}
void bootstrap();
