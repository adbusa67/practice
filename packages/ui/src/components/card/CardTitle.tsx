import { cn } from "@event-ease/ui";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({
  children,
  className,
  ...props
}: CardTitleProps) {
  return (
    <h2
      className={cn('font-medium', className)}
      {...props}
    >
      {children}
    </h2>
  )
}