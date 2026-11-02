import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import pinoHttp from "pino-http";
import type { Logger } from "pino";
import { AppModule } from "./app.module";
import { APP_LOGGER } from "./common/logger";
import { APP_ENV, type ApiEnv } from "./config/env";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const env = app.get<ApiEnv>(APP_ENV);
  const logger = app.get<Logger>(APP_LOGGER);

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      genReqId: (request, response) => {
        const header = request.headers["x-request-id"];
        const id =
          typeof header === "string" && header.length > 0 && header.length <= 128
            ? header
            : randomUUID();
        response.setHeader("x-request-id", id);
        return id;
      },
      autoLogging: {
        ignore: (request) => (request.url ?? "").startsWith("/v1/health"),
      },
    }),
  );

  app.enableCors({
    origin: env.API_CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization", "x-request-id"],
    exposedHeaders: ["x-request-id"],
    maxAge: 86_400,
  });

  app.setGlobalPrefix("v1");

  // API docs are development-only. Disable or protect /docs at the ingress in production.
  if (env.NODE_ENV !== "production") {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Medicare API")
        .setDescription(
          "Healthcare navigation API. All patient data endpoints require a Supabase access token.",
        )
        .setVersion("0.1.0")
        .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "supabase")
        .build(),
    );
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();
  await app.listen(env.API_PORT, "0.0.0.0");
  logger.info({ port: env.API_PORT, environment: env.NODE_ENV }, "medicare_api_listening");
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start the Medicare API:", error);
  process.exitCode = 1;
});
