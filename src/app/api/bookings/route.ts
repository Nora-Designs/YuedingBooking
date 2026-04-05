import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendBookingNotificationToTeacher,
  sendConflictNotificationToTeacher,
} from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(bookings)
}

export async function POST(req: NextRequest) {
  try {
    const {
      teacherId, date, customerName, customerContact, note,
      bookingType = 'student', serviceId,
      learnTarget, weddingDate, serviceContent,
      bridalPhone, numDresses, banquetType, needsFollowUp, needsTrial, venueLocation, banquetTime,
    } = await req.json()

    if (!teacherId || !date || !customerName || !customerContact) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 })
    }
    if (!['student', 'bridal'].includes(bookingType)) {
      return NextResponse.json({ error: '無效的預約類型' }, { status: 400 })
    }

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true, email: true },
    })
    if (!teacher) return NextResponse.json({ error: '找不到老師' }, { status: 404 })

    // Check availability for this bookingType
    const avail = await prisma.availability.findUnique({
      where: { userId_date_forType: { userId: teacherId, date, forType: bookingType } },
    })

    // ── Normal booking (available slot) ──
    if (avail?.status === 'available') {
      const booking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            userId: teacherId, date, customerName, customerContact,
            note: note || null, bookingType, status: 'pending',
            serviceId: serviceId || null,
            learnTarget: learnTarget || null,
            weddingDate: weddingDate || null,
            serviceContent: serviceContent || null,
            bridalPhone: bridalPhone || null,
            numDresses: numDresses || null,
            banquetType: banquetType || null,
            needsFollowUp: needsFollowUp ?? null,
            needsTrial: needsTrial ?? null,
            venueLocation: venueLocation || null,
            banquetTime: banquetTime || null,
          },
        })
        await tx.availability.update({
          where: { userId_date_forType: { userId: teacherId, date, forType: bookingType } },
          data: { status: 'booked' },
        })
        return b
      })

      sendBookingNotificationToTeacher({
        teacherName: teacher.name, teacherEmail: teacher.email,
        customerName, customerContact, date, note, bookingType,
      }).catch(() => {})

      return NextResponse.json(booking, { status: 201 })
    }

    // ── Bridal conflict: wants a student-booked date ──
    if (bookingType === 'bridal') {
      const studentBooked = await prisma.availability.findUnique({
        where: { userId_date_forType: { userId: teacherId, date, forType: 'student' } },
      })

      if (studentBooked?.status === 'booked') {
        const studentBooking = await prisma.booking.findFirst({
          where: {
            userId: teacherId, date, bookingType: 'student',
            status: { in: ['pending', 'confirmed'] },
          },
        })

        const bridalBooking = await prisma.booking.create({
          data: {
            userId: teacherId, date, customerName, customerContact,
            note: note || null, bookingType: 'bridal', status: 'conflict_pending',
            serviceId: serviceId || null,
            weddingDate: weddingDate || null,
            serviceContent: serviceContent || null,
            bridalPhone: bridalPhone || null,
            numDresses: numDresses || null,
            banquetType: banquetType || null,
            needsFollowUp: needsFollowUp ?? null,
            needsTrial: needsTrial ?? null,
            venueLocation: venueLocation || null,
            banquetTime: banquetTime || null,
          },
        })

        sendConflictNotificationToTeacher({
          teacherName: teacher.name, teacherEmail: teacher.email,
          bridalName: customerName, bridalContact: customerContact,
          studentName: studentBooking?.customerName || '學員',
          studentContact: studentBooking?.customerContact || '—',
          date, note,
        }).catch(() => {})

        return NextResponse.json(bridalBooking, { status: 201 })
      }
    }

    return NextResponse.json({ error: '此日期已無法預約' }, { status: 409 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
