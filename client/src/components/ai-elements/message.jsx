import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

const roleMeta = {
  assistant: {
    icon: Bot,
    bubble: "bg-muted text-muted-foreground",
  },
  system: {
    icon: Bot,
    bubble: "bg-muted text-muted-foreground",
  },
  user: {
    icon: User,
    bubble: "bg-primary text-primary-foreground",
  },
};

export function Message({ from = "assistant", children, className, ...props }) {
  const meta = roleMeta[from] || roleMeta.assistant;
  const Icon = meta.icon;
  const alignEnd = from === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2 text-sm",
        alignEnd ? "justify-end text-right" : "justify-start text-left",
        className,
      )}
      {...props}
    >
      {!alignEnd && (
        <div className="mt-1 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="max-w-[85%] flex flex-col gap-1">
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { from })
            : child,
        )}
      </div>
      {alignEnd && (
        <div className="mt-1 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

export function MessageContent({
  from = "assistant",
  className,
  ...props
}) {
  const meta = roleMeta[from] || roleMeta.assistant;
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2 shadow-sm",
        meta.bubble,
        className,
      )}
      {...props}
    />
  );
}

