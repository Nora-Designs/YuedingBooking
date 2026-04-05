import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const services = await prisma.service.findMany({
    where: { userId: session.user.id },
    orderBy: [{ serviceType: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, price, showPrice = true, serviceType = 'bridal', sortOrder = 0, isActive = true } =
    await req.json()

  if (!name?.trim()) return NextResponse.json({ error: '服務名稱不能為空' }, { status: 400 })

  const service = await prisma.service.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      price: price?.trim() || null,
      showPrice, serviceType, sortOrder, isActive,
    },
  })
  return NextResponse.json(service, { status: 201 })
}
