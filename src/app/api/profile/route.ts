import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, bio: true, price: true, showPrices: true, images: true, slug: true, avatar: true, portfolioLinks: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...user,
    images: JSON.parse(user.images || '[]'),
    portfolioLinks: JSON.parse(user.portfolioLinks || '[]'),
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, bio, price, showPrices, images, avatar, portfolioLinks } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: '名稱不能為空' }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      bio:  bio?.trim()   || null,
      price: price?.trim() || null,
      showPrices: showPrices ?? true,
      images: JSON.stringify(Array.isArray(images) ? images : []),
      avatar: avatar?.trim() || null,
      portfolioLinks: JSON.stringify(Array.isArray(portfolioLinks) ? portfolioLinks : []),
    },
    select: { name: true, bio: true, price: true, showPrices: true, images: true, slug: true, avatar: true, portfolioLinks: true },
  })

  return NextResponse.json({
    ...updated,
    images: JSON.parse(updated.images || '[]'),
    portfolioLinks: JSON.parse(updated.portfolioLinks || '[]'),
  })
}
