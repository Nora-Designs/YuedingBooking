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

  const body = await req.json()
  const { status, classNumber, lessonContent, deposit } = body

  // ── Teacher-auth required for status changes ──
  if (status) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const allowed = ['confirmed', 'cancelled', 'conflict_resolved']
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    })

    // If cancelled → free up the slot if no other active booking on this date
    if (status === 'cancelled') {
      const other = await prisma.booking.findFirst({
        where: {
          userId: session.user.id, date: booking.date,
          bookingType: booking.bookingType, id: { not: params.id },
          status: { in: ['pending', 'confirmed'] },
        },
      })
      if (!other) {
        await prisma.availability.updateMany({
          where: {
            userId: session.user.id, date: booking.date,
            forType: booking.bookingType, status: 'booked',
          },
          data: { status: 'available' },
        })
      }
    }

    return NextResponse.json(updated)
  }

  // ── Teacher notes update (classNumber, lessonContent, deposit) ──
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      ...(classNumber  !== undefined && { classNumber  }),
      ...(lessonContent !== undefined && { lessonContent }),
      ...(deposit      !== undefined && { deposit      }),
    },
  })
  return NextResponse.json(updated)
}
