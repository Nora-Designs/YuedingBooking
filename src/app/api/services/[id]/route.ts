import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const service = await prisma.service.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.service.update({
    where: { id: params.id },
    data: {
      ...(body.name        !== undefined && { name:        body.name.trim()        }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.price       !== undefined && { price:       body.price?.trim()       || null }),
      ...(body.showPrice   !== undefined && { showPrice:   body.showPrice   }),
      ...(body.serviceType !== undefined && { serviceType: body.serviceType }),
      ...(body.sortOrder   !== undefined && { sortOrder:   body.sortOrder   }),
      ...(body.isActive    !== undefined && { isActive:    body.isActive    }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.service.deleteMany({
    where: { id: params.id, userId: session.user.id },
  })
  return NextResponse.json({ ok: true })
}
