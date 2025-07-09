
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent-main text-bg-primary hover:shadow-[0_0_16px_theme(colors.accent-main)] hover:scale-105",
        destructive: "bg-danger text-white hover:shadow-[0_0_16px_theme(colors.danger)] hover:scale-105",
        outline: "border border-accent-main/30 bg-surface-1 text-text-high hover:bg-surface-2 hover:shadow-[0_0_8px_theme(colors.accent-main/50)]",
        secondary: "bg-surface-1 text-text-high border border-accent-main/30 hover:bg-surface-2 hover:shadow-[0_0_8px_theme(colors.accent-main/50)]",
        ghost: "bg-transparent text-text-high hover:bg-surface-1 hover:text-accent-main",
        link: "text-accent-main underline-offset-4 hover:underline hover:text-accent-alt",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
