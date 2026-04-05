import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalBookings, pendingBookings, conflictBookings, availableDays] = await Promise.all([
    prisma.booking.count({ where: { userId: session.user.id, status: { not: 'cancelled' } } }),
    prisma.booking.count({ where: { userId: session.user.id, status: 'pending' } }),
    prisma.booking.count({ where: { userId: session.user.id, status: 'conflict_pending' } }),
    prisma.availability.count({ where: { userId: session.user.id, status: 'available' } }),
  ])

  return NextResponse.json({ totalBookings, pendingBookings, conflictBookings, availableDays })
}
