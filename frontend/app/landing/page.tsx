import Header from "./components/header";
import Import from "./components/import";

export default function LandingPage() {
  return (
    <div className="flex-col justify-center items-center min-h-screen">
      <Header />
      <Import />
    </div>
  );
}
