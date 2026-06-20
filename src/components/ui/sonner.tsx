"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-base !border-2 !border-border !bg-secondary-background !text-foreground !shadow-shadow !font-mono",
          title: "!font-heading !uppercase !tracking-tight !text-xs",
          description: "!text-muted-foreground",
          success: "!text-success",
          error: "!text-danger",
        },
      }}
      {...props}
    />
  );
}
