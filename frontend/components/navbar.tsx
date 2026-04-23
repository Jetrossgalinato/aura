export function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="text-lg font-bold">Aura</div>
        <div>
          <a href="/landing" className="px-3 py-2 text-sm font-medium">
            Home
          </a>
          {/* Add more navigation links here */}
        </div>
      </div>
    </nav>
  );
}
