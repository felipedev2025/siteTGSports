import Image from "next/image";

interface LogoProps {
  logoUrl?: string | null;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  badgeClassName?: string;
}

export function Logo({ logoUrl, size = 36, showText = true, textClassName, badgeClassName }: LogoProps) {
  return (
    <span className="flex items-center gap-2">
      {logoUrl ? (
        <span className="relative shrink-0 overflow-hidden rounded-lg" style={{ width: size, height: size }}>
          <Image src={logoUrl} alt="TG Sports" fill sizes={`${size}px`} className="object-contain" />
        </span>
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg font-black text-white ${badgeClassName ?? "bg-navy-900"}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          TG
        </span>
      )}
      {showText && (
        <span className={textClassName ?? "text-lg font-extrabold tracking-tight text-navy-900"}>
          TG <span className="text-blue-600">Sports</span>
        </span>
      )}
    </span>
  );
}
