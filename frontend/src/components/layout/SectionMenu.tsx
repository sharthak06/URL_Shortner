import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANDING_SECTIONS } from "@/components/landing/sections";
import { cn } from "@/lib/utils";

interface SectionMenuProps {
  activeSection: string | null;
  onJump: (id: string) => void;
}

/** Phone-sized section menu. Lazy-loaded so the dropdown code stays out of the main bundle. */
const SectionMenu: React.FC<SectionMenuProps> = ({ activeSection, onJump }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Jump to section">
        <Menu className="h-4 w-4" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">
      {LANDING_SECTIONS.map((section) => (
        <DropdownMenuItem
          key={section.id}
          onSelect={() => onJump(section.id)}
          className={cn("text-xs", activeSection === section.id && "text-zinc-100")}
        >
          {section.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default SectionMenu;
