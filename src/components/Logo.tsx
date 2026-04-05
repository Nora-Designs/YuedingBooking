import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'lg'
  href?: string
  className?: string
}

export function LogoText({ size = 'sm', href = '/', className = '' }: LogoProps) {
  const isLg = size === 'lg'
  const w = isLg ? 160 : 100
  const h = isLg ? 160 : 100

  const visual = (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ background: 'none' }}
    >
      <Image
        src="/logo.png"
        alt="i客"
        width={w}
        height={h}
        priority
        className="object-contain"
        style={{ background: 'transparent', display: 'block' }}
      />
    </span>
  )

  if (!href) return visual
  return <Link href={href} style={{ background: 'none' }}>{visual}</Link>
}

export default LogoText
