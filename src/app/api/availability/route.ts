import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const availability = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: [{ forType: 'asc' }, { date: 'asc' }],
  })
  return NextResponse.json(availability)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, status, forType = 'student' } = await req.json()

  if (!date || !['available', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
  if (!['student', 'bridal'].includes(forType)) {
    return NextResponse.json({ error: 'Invalid forType' }, { status: 400 })
  }

  const result = await prisma.availability.upsert({
    where: { userId_date_forType: { userId: session.user.id, date, forType } },
    update: { status },
    create: { userId: session.user.id, date, forType, status },
  })
  return NextResponse.json(result)
}
