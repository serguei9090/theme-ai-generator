"use client"
import React from 'react'
import { cn } from './cn'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active',
        outline: 'border border-border bg-background text-text hover:bg-surface border-border-hover',
        ghost: 'bg-transparent text-text hover:bg-surface',
        destructive: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        default: 'h-9 px-3 py-2 text-sm',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export default Button
