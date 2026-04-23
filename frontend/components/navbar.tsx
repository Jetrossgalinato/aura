import { ModeToggle } from "./mode-toggle";

export function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="text-lg font-bold">Aura</div>
        <div>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
