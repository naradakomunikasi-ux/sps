export type Role = "PARTICIPANT" | "FACILITATOR" | "PTM_COORDINATOR" | "ADMIN" | "DIRECTOR";
export type Permission = "profile.read.self" | "enrollment.read.self" | "session.read.assigned" | "ptm.read.assigned" | "ptm.read.scoped" | "participant.read.scoped" | "enrollment.manage.scoped" | "report.read.scoped";
export interface Context { personId: string; activeRole: Role; batchIds: string[]; }
export interface Resource { personId?: string; batchId?: string; }
export const permissionBundles: Readonly<Record<Role, readonly Permission[]>> = Object.freeze({
 PARTICIPANT: Object.freeze(["profile.read.self", "enrollment.read.self", "session.read.assigned"]),
 FACILITATOR: Object.freeze(["ptm.read.assigned"]),
 PTM_COORDINATOR: Object.freeze(["ptm.read.scoped"]),
 ADMIN: Object.freeze(["participant.read.scoped", "enrollment.manage.scoped"]),
 DIRECTOR: Object.freeze(["report.read.scoped"])
});
const selfPermissions: ReadonlySet<Permission> = new Set(["profile.read.self","enrollment.read.self"]);
const scopedPermissions: ReadonlySet<Permission> = new Set(["session.read.assigned","ptm.read.assigned","ptm.read.scoped","participant.read.scoped","enrollment.manage.scoped","report.read.scoped"]);
export function authorize(ctx: Context | null, permission: string, resource: Resource): boolean {
 if (!ctx || !ctx.personId || !resource || !Object.hasOwn(permissionBundles,ctx.activeRole)) return false;
 if (!(permissionBundles[ctx.activeRole] as readonly string[]).includes(permission)) return false;
 if (selfPermissions.has(permission as Permission)) return typeof resource.personId === 'string' && resource.personId.length>0 && ctx.personId===resource.personId;
 if (scopedPermissions.has(permission as Permission)) return typeof resource.batchId === 'string' && resource.batchId.length>0 && Array.isArray(ctx.batchIds) && ctx.batchIds.includes(resource.batchId);
 return false;
}
