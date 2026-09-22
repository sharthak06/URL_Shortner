export interface AcquireLockResult {
  acquired: boolean;
  lockId: string | null;
}

export interface ILockService {
  acquireLock(key: string, ttlSeconds?: number): Promise<AcquireLockResult>;
  releaseLock(key: string, lockId: string): Promise<boolean>;
}
