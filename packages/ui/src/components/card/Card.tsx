import { cn, cva, VariantProps } from "@event-ease/ui";
import { CardTitle } from "./CardTitle";
import { CardSubtitle } from "./CardSubtitle";

const cardVariants = cva(
  "rounded-md p-5 bg-blue-50 border border-blue-200",
  {
    variants: {
      open: {
        true: "",
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

export interface CardProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  className?: string;
  /** Whether the card is open/open */
  open?: boolean;
}

export function Card({
  children,
  className,
  open,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ open }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;