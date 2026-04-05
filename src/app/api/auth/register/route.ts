import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, slug } = await req.json()

    if (!name || !email || !password || !slug) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 })
    }

    // slug validation: alphanumeric + dash only
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: '連結只能包含小寫英文、數字、和 -' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { slug }] },
    })

    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: '此 Email 已被使用' }, { status: 400 })
      }
      return NextResponse.json({ error: '此連結已被使用，請換一個' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashed, slug },
    })

    return NextResponse.json({ id: user.id, slug: user.slug }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
