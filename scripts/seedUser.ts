import '../server/env/dotenv'
import crypto from 'node:crypto'
import prisma from '../prisma/prisma'
import { hashPassword } from '../server/utils/password'

const [, , argUsername, argPassword] = process.argv

const username = argUsername || 'kun-admin'
const password = argPassword || crypto.randomBytes(6).toString('base64url')

const main = async () => {
  const hashed = await hashPassword(password)
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashed,
      display_name: '超级链接管理员'
    },
    create: {
      username,
      password: hashed,
      display_name: '超级链接管理员'
    }
  })

  console.log('✅ 已创建/更新登录账号:')
  console.log(`   用户名: ${user.username}`)
  console.log(`   密码: ${password}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
