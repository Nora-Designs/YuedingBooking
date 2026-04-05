import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeacherBookingClient from './TeacherBookingClient'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const t = await prisma.user.findUnique({
    where: { slug: params.slug }, select: { name: true, bio: true },
  })
  if (!t) return { title: '找不到頁面' }
  return { title: `預約 ${t.name}`, description: t.bio || `預約 ${t.name}` }
}

export default async function TeacherPage({ params }: Props) {
  const teacher = await prisma.user.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, name: true, bio: true, price: true, showPrices: true, images: true,
      availability: {
        where: { status: { in: ['available', 'booked'] } },
        select: { date: true, forType: true, status: true },
      },
      services: {
        where: { isActive: true },
        select: { id: true, name: true, description: true, price: true,
                  showPrice: true, serviceType: true, sortOrder: true },
        orderBy: [{ serviceType: 'asc' }, { sortOrder: 'asc' }],
      },
    },
  })

  if (!teacher) notFound()

  return (
    <TeacherBookingClient
      teacher={{
        id: teacher.id, name: teacher.name, bio: teacher.bio,
        price: teacher.price, showPrices: teacher.showPrices,
        images: JSON.parse(teacher.images || '[]') as string[],
        slug: params.slug,
      }}
      availability={teacher.availability}
      services={teacher.services}
    />
  )
}
