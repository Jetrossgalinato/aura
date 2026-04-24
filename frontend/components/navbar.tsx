import { ModeToggle } from "./mode-toggle";
import Image from "next/image";
import logo from "@/app/icon.png";

export function Navbar() {
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
