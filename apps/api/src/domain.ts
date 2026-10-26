import { stateRegistry, canTransitionState } from './state-registry.ts';
export const enrollmentTransitions = stateRegistry.enrollment;
export type EnrollmentStatus = keyof typeof enrollmentTransitions;
export function canTransition(from: string, to: string): boolean {return canTransitionState('enrollment',from,to);}
export function requireIdempotencyKey(value: unknown): string {
 if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(value)) throw new Error('Invalid idempotency key');
 return value;
}
