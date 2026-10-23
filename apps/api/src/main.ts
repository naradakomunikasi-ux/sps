import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Post, Body, Headers, UnauthorizedException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { PgSessionRepository } from './postgres-repositories';
import { resolveSessionContext } from './session-service';
import { authorize } from './security';
import { getOwnEnrollments } from './my-sps-service';
import { changeOwnActiveRole, RoleSwitchDenied } from './role-context-switch';
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }) : null;
function bearer(header?: string) {return header && /^Bearer [A-Za-z0-9_-]{32,128}$/.test(header) ? header.slice(7) : undefined}
function db() {if (!pool) throw new ServiceUnavailableException('Database not configured');return pool}
@Controller('health') class HealthController {@Get() health() {return {status:'ok',service:'sps-api'}}}
@Controller('v1/me') class MeController {
 @Get('profile') async profile(@Headers('authorization') authorization?:string) {
  const token=bearer(authorization);if(!token)throw new UnauthorizedException();
  try {const ctx=await resolveSessionContext(token,new PgSessionRepository(db()));if(!ctx)throw new UnauthorizedException();if(!authorize(ctx,'profile.read.self',{personId:ctx.personId}))throw new ForbiddenException();return {personId:ctx.personId,activeRole:ctx.activeRole}}
  catch(e){if(e instanceof UnauthorizedException||e instanceof ForbiddenException||e instanceof ServiceUnavailableException)throw e;throw new ServiceUnavailableException()}
 }
 @Get('enrollments') async enrollments(@Headers('authorization') authorization?:string){
  const token=bearer(authorization);if(!token)throw new UnauthorizedException();
  try {const result=await getOwnEnrollments(token,new PgSessionRepository(db()),db());if(result.status===401)throw new UnauthorizedException();if(result.status===403)throw new ForbiddenException();return result.body}
  catch(e){if(e instanceof UnauthorizedException||e instanceof ForbiddenException||e instanceof ServiceUnavailableException)throw e;throw new ServiceUnavailableException()}
 }
 @Post('active-role') async switchRole(@Headers('authorization') authorization?:string,@Headers('x-correlation-id') correlationId?:string,@Body() payload?:{role?:string}){
  const token=bearer(authorization);if(!token)throw new UnauthorizedException();
  if(!payload||typeof payload.role!=='string'||!correlationId)throw new ForbiddenException('Invalid role change request');
  try{return await changeOwnActiveRole(db(),token,payload.role as Parameters<typeof changeOwnActiveRole>[2],correlationId)}
  catch(e){if(e instanceof RoleSwitchDenied)throw new ForbiddenException('Role change denied');if(e instanceof ServiceUnavailableException)throw e;throw new ServiceUnavailableException('Role context service unavailable')}
 }
}
@Module({controllers:[HealthController,MeController]}) class AppModule {}
async function bootstrap(){const app=await NestFactory.create(AppModule);app.enableShutdownHooks();await app.listen(Number(process.env.PORT??3001),'0.0.0.0')}
void bootstrap();
