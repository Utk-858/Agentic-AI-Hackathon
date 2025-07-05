import { cn } from "@/lib/utils";
import React from "react";

const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-8 h-8", className)}
      {...props}
    >
      <title>GuruMitra Logo</title>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M12 2v20" />
      <path d="M12 12h8" />
      <path d="m5 12 2-2 2 2-2 2-2-2z" />
    </svg>
  );
};

export default Logo;
