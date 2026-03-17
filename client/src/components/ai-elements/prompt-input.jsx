import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";

const PromptInputContext = createContext(null);

export function PromptInputProvider({ children }) {
  const [inputValue, setInputValue] = useState("");

  const controller = useMemo(
    () => ({
      textInput: {
        value: inputValue,
        setInput: setInputValue,
        clear: () => setInputValue(""),
      },
    }),
    [inputValue],
  );

  return (
    <PromptInputContext.Provider
      value={{ inputValue, setInputValue, controller }}
    >
      {children}
    </PromptInputContext.Provider>
  );
}

export function usePromptInputController() {
  const ctx = useContext(PromptInputContext);
  if (!ctx) {
    throw new Error("usePromptInputController must be used within PromptInputProvider");
  }
  return ctx.controller;
}

export function PromptInput({ className, ...props }) {
  return (
    <form
      className={cn(
        "flex items-center gap-2 p-3 bg-background",
        className,
      )}
      {...props}
    />
  );
}

export function PromptInputTextarea({ className, ...props }) {
  const ctx = useContext(PromptInputContext);
  if (!ctx) {
    throw new Error("PromptInputTextarea must be used within PromptInputProvider");
  }

  const handleChange = useCallback(
    (event) => {
      ctx.setInputValue(event.target.value);
      props?.onChange?.(event);
    },
    [ctx, props],
  );

  const { inputValue } = ctx;

  return (
    <textarea
      className={cn(
        "flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      rows={2}
      value={inputValue}
      onChange={handleChange}
      {...props}
    />
  );
}

export function PromptInputSubmit({
  status,
  children,
  className,
  disabled,
  ...props
}) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {status === "submitted" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : children ? (
        children
      ) : (
        <Send className="h-4 w-4" />
      )}
    </button>
  );
}

