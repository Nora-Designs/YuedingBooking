import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public endpoint — no auth required.
// The booking CUID itself acts as an unguessable token.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, name: true, slug: true } } },
  })

  if (!booking) return NextResponse.json({ error: '找不到此預約' }, { status: 404 })
  if (['cancelled', 'conflict_resolved'].includes(booking.status)) {
    return NextResponse.json({ error: '此預約已取消' }, { status: 400 })
  }

  await prisma.booking.update({
    where: { id: params.id },
    data: { status: 'cancelled' },
  })

  // Free up the availability slot if no other active booking on this date
  const other = await prisma.booking.findFirst({
    where: {
      userId: booking.userId, date: booking.date,
      bookingType: booking.bookingType, id: { not: params.id },
      status: { in: ['pending', 'confirmed'] },
    },
  })
  if (!other) {
    await prisma.availability.updateMany({
      where: {
        userId: booking.userId, date: booking.date,
        forType: booking.bookingType, status: 'booked',
      },
      data: { status: 'available' },
    })
  }

  return NextResponse.json({ ok: true, teacherSlug: booking.user.slug ?? '' })
}
