import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { ButtonHTMLAttributes } from 'react';

export const buttonVariants = cva(
  'cursor-pointer font-semibold rounded-lg px-4 py-2 transition-colors duration-150 ease-in-out',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
        text: 'text-blue-600 hover:bg-blue-50',
        success: 'bg-green-600 text-white hover:bg-green-700',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}