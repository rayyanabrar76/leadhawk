import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'icon' | 'full'
  size?: 'sm' | 'md' | 'lg'
  href?: string | null
  className?: string
}

const ICON_SIZES = { sm: 24, md: 32, lg: 40 } as const
const TEXT_SIZES = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' } as const

export function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  className = '',
}: LogoProps) {
  const iconPx = ICON_SIZES[size]
  const textCls = TEXT_SIZES[size]

  const content =
    variant === 'icon' ? (
      <Image
        src="/logo-icon.png"
        alt="LeadHawk"
        width={iconPx}
        height={iconPx}
        priority
        className={className}
      />
    ) : (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image
          src="/logo-icon.png"
          alt=""
          width={iconPx}
          height={iconPx}
          priority
        />
        <span className={`font-semibold tracking-tight text-zinc-100 ${textCls}`}>
          Lead<span className="text-violet-500">Hawk</span>
        </span>
      </div>
    )

  if (!href) return content

  return (
    <Link
      href={href}
      className="inline-flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
    >
      {content}
    </Link>
  )
}
