import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-extrabold leading-none text-slate-700", className)}
      {...props}
    />
  );
}
