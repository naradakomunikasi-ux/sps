export const roleCodes = ['PARTICIPANT','FACILITATOR','PTM_COORDINATOR','ADMIN','DIRECTOR'] as const;
export type RoleCode = typeof roleCodes[number];
export function parseRoleContextRequest(body: unknown, correlationId: unknown): {role:RoleCode;correlationId:string}|null {
  if (!body || typeof body!=='object' || Array.isArray(body)) return null;
  const record = body as Record<string,unknown>;
  if(Object.keys(record).length!==1 || !roleCodes.includes(record.role as RoleCode))return null;
  if(typeof correlationId !== 'string'|| !/^[A-Za-z0-9_-]{8,128}$/.test(correlationId))return null;
  return {role:record.role as RoleCode,correlationId};
}
