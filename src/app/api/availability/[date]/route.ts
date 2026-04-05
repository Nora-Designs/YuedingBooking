import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const forType = req.nextUrl.searchParams.get('forType') || 'student'

  await prisma.availability.deleteMany({
    where: { userId: session.user.id, date: params.date, forType },
  })
  return NextResponse.json({ ok: true })
}
