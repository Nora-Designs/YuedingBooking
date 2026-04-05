import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public GET — customer can view their own booking by ID (acts as token)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, slug: true } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })

  if (!booking) return NextResponse.json({ error: '找不到此預約' }, { status: 404 })

  // Return safe subset (no internal fields)
  return NextResponse.json({
    id:              booking.id,
    date:            booking.date,
    bookingType:     booking.bookingType,
    status:          booking.status,
    customerName:    booking.customerName,
    customerContact: booking.customerContact,
    note:            booking.note,
    weddingDate:     booking.weddingDate,
    banquetType:     booking.banquetType,
    venueLocation:   booking.venueLocation,
    banquetTime:     booking.banquetTime,
    numDresses:      booking.numDresses,
    needsFollowUp:   booking.needsFollowUp,
    needsTrial:      booking.needsTrial,
    learnTarget:     booking.learnTarget,
    teacherName:     (booking as { user?: { name: string } }).user?.name ?? '',
    teacherSlug:     (booking as { user?: { slug: string } }).user?.slug ?? '',
    createdAt:       booking.createdAt,
  })
}
