import { argon2id } from '@noble/hashes/argon2.js'
import crypto from 'node:crypto'

const hashOptions = {
  t: 2,
  m: 4096,
  p: 3
}

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await argon2id(password, salt, hashOptions)
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`
}

export const verifyPassword = async (password: string, stored: string) => {
  const [salt, digest] = stored.split(':')
  if (!salt || !digest) return false
  const derivedKey = await argon2id(password, salt, hashOptions)
  return Buffer.from(derivedKey).toString('hex') === digest
}