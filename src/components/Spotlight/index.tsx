import React from "react";
import { cn } from "@/lib/utils";
import { Spotlight } from "../ui/spotlight";

interface SpotlightPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;

}

export function SpotlightPreview({ className, ...props }: SpotlightPreviewProps) {
  return (
    <div className={cn("w-full h-full relative overflow-hidden", className)} {...props}>
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
    </div>
  );
}