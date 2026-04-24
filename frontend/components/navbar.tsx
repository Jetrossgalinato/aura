import { ModeToggle } from "./mode-toggle";
import Image from "next/image";
import logo from "@/app/icon.png";
import { Skeleton } from "@/components/ui/skeleton";

type NavbarProps = {
  isLoading?: boolean;
};

export function Navbar({ isLoading = false }: NavbarProps) {
  if (isLoading) {
    return (
      <nav className="w-full border-b">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex flex-row text-lg font-bold gap-2">
          <Image src={logo.src} alt="Logo" height={28} width={28} />
          Aura
        </div>
        <div>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
