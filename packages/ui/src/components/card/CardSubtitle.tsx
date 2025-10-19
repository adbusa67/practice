import { cn } from "@event-ease/ui";

export interface CardSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardSubtitle({
  children,
  className,
  ...props
}: CardSubtitleProps) {
  return (
    <p
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </p>
  )
}