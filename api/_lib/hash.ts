// ============================================================
//  비밀번호 단방향 해시 유틸 (bcrypt)
//  - 해시(hashPassword): 평문 → bcrypt 해시 (salt 자동 포함, 복호화 불가)
//  - 검증(verifyPassword): 평문을 같은 방식으로 해시해 비교만 가능
//  DB 에는 반드시 해시만 저장하고 평문은 어디에도 남기지 않는다.
// ============================================================
import bcrypt from 'bcryptjs'

// 해시 비용(라운드). 높을수록 안전하지만 느려짐 — 10이 통상 기본값.
const SALT_ROUNDS = 10

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
