import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white shadow-sm hover:bg-accent/90 rounded-[var(--radius-button)]",
        outline:
          "border-2 border-ink-border bg-surface text-ink hover:bg-subtle-fill rounded-[var(--radius-button)]",
        ghost: "hover:bg-subtle-fill text-ink rounded-[var(--radius-chip)]",
      },
      size: {
        default: "min-h-[var(--tap-min)] px-5 py-2 text-sm",
        lg: "min-h-[var(--tap-primary)] px-6 text-base",
        icon: "size-[var(--tap-min)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
