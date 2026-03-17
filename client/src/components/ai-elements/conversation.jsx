import React from "react";
import { cn } from "@/lib/utils";

export const Conversation = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col h-full overflow-hidden rounded-lg border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Conversation.displayName = "Conversation";

export const ConversationContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-1 overflow-y-auto p-4 space-y-3 text-sm",
        className,
      )}
      {...props}
    />
  ),
);
ConversationContent.displayName = "ConversationContent";

export function ConversationEmptyState({
  icon,
  title,
  description,
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-lg border border-dashed p-6 text-muted-foreground bg-muted/30",
        className,
      )}
      {...props}
    >
      {icon ? <div className="mb-2 text-muted-foreground">{icon}</div> : null}
      {title ? <h4 className="text-sm font-semibold">{title}</h4> : null}
      {description ? (
        <p className="text-xs text-muted-foreground/80">{description}</p>
      ) : null}
      {children ? <div className="mt-2 w-full">{children}</div> : null}
    </div>
  );
}
