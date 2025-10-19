"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@event-ease/ui";
import { createContext } from "react";
import { Card, type CardProps } from "./Card";

export type CollapsibleCardProps = CardProps & React.ComponentProps<typeof CollapsiblePrimitive.Root>;

export const CollapsibleCardContext = createContext({
  open: false,
});

export function CollapsibleCard({
  children,
  className,
  open,
  ...props
}: CollapsibleCardProps) {
  return (
    <CollapsibleCardContext.Provider value={{ open: !!open }}>
      <CollapsiblePrimitive.Root {...props} open={open} asChild>
        <Card
          className={cn('p-0', className)}
          open={open}
        >
          {children}
        </Card>
      </CollapsiblePrimitive.Root>
    </CollapsibleCardContext.Provider>
  )
}

export function CollapsibleCardTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn(
        'p-5 rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Trigger>
  )
}

export function CollapsibleCardContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={cn('p-5', className)}
      {...props}
      asChild
    >
      {children}
    </CollapsiblePrimitive.Content>
  )
}

CollapsibleCard.Trigger = CollapsibleCardTrigger;
CollapsibleCard.Content = CollapsibleCardContent;