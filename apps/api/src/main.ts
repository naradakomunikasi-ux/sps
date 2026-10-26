import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Post, Body, Headers, Req, HttpCode, UnauthorizedException, ForbiddenException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { receiveZoomWebhook } from './zoom-webhook-http';
import { PgSessionRepository } from './postgres-repositories';
import { resolveSessionContext } from './session-service';
import { authorize } from './security';
import { getOwnEnrollments } from './my-sps-service';
import { changeOwnActiveRole, RoleSwitchDenied } from './role-context-switch';
import { parseRoleContextRequest } from './role-context-request';

// Never accept client-selected role/person identity; all scope is server-side.
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }) : null;
function bearer(header?: string) {
  if (!header || !/^Bearer [A-Za-z0-9_-]{32,128}$/.test(header)) return undefined;
  return header.slice(7);
}
function db() {
  if (!pool) throw new ServiceUnavailableException('Database not configured');
  return pool;
}
@Controller('health') class HealthController {
  @Get() health() { return { status: 'ok', service: 'sps-api' }; }
}
@Controller('v1/me') class MeController {
  @Get('profile') async profile(@Headers('authorization') authorization?: string) {
    const token = bearer(authorization);
    if (!token) throw new UnauthorizedException('Verified session required');
    const connection = db();
    try {
      const ctx = await resolveSessionContext(token, new PgSessionRepository(connection));
      if (!ctx) throw new UnauthorizedException('Verified session required');
      if (!authorize(ctx, 'profile.read.self', { personId: ctx.personId })) throw new ForbiddenException();
      return { personId: ctx.personId, activeRole: ctx.activeRole };
    } catch (e) {
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new ServiceUnavailableException('Identity service unavailable');
    }
  }
  @Post('active-role') async switchRole(@Headers('authorization') authorization?: string, @Headers('x-correlation-id') correlationId?: string, @Body() payload?: {role?: string}) {
    const token = bearer(authorization);
    if (!token) throw new UnauthorizedException('Verified session required');
    const request = parseRoleContextRequest(payload, correlationId);
    if (!request) throw new BadRequestException('Invalid role change request');
    try {
      return await changeOwnActiveRole(db(), token, request.role, request.correlationId);
    } catch (e) {
      if (e instanceof RoleSwitchDenied) throw new ForbiddenException('Role change denied');
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException('Role context service unavailable');
    }
  }
  @Get('enrollments') async enrollments(@Headers('authorization') authorization?: string) {
    const token = bearer(authorization);
    if (!token) throw new UnauthorizedException('Verified session required');
    const connection = db();
    try {
      const result = await getOwnEnrollments(token, new PgSessionRepository(connection), connection);
      if (result.status === 401) throw new UnauthorizedException();
      if (result.status === 403) throw new ForbiddenException();
      return result.body;
    } catch (e) {
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new ServiceUnavailableException('Enrollment service unavailable');
    }
  }
}
/** Signed provider webhook; transport preserves untouched request bytes. */
@Controller('v1/integrations/zoom') class ZoomWebhookController {
  @Post('webhook')
  @HttpCode(200)
  async receive(@Req() request: {rawBody?: Buffer},
                @Headers('x-zm-signature') signature?: string,
                @Headers('x-zm-request-timestamp') timestamp?: string) {
    if (!process.env.ZOOM_WEBHOOK_SECRET) {
      throw new ServiceUnavailableException('Zoom integration unavailable');
    }
    const result = await receiveZoomWebhook({
      pool: pool ?? undefined, rawBody: request.rawBody, signature, timestamp,
      secret: process.env.ZOOM_WEBHOOK_SECRET,
      nowSeconds: Math.floor(Date.now() / 1000)
    });
    // The response body intentionally never exposes provider verification details.
    if (result.status === 503) throw new ServiceUnavailableException('Zoom integration unavailable');
    if (result.status === 401) throw new UnauthorizedException('Webhook rejected');
    if (result.status === 400) throw new BadRequestException('Webhook request rejected');
    return result.body;
  }
}
@Module({ controllers: [HealthController, MeController, ZoomWebhookController] }) class AppModule {}
async function bootstrap() {
 const app = await NestFactory.create(AppModule, { rawBody: true });
 app.enableShutdownHooks();
 await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}
void bootstrap();
