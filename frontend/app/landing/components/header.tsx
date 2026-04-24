import { TypographyH1, TypographyH4 } from "@/components/typography";

export default function Header() {
  return (
    <header className="flex-row text-center gap-4 mt-18">
      <div className="mb-4">
        <TypographyH1>From Raw Data to Real Predictions</TypographyH1>
      </div>
      <div className="text-muted-foreground">
        <TypographyH4>
          Effortlessly process your datasets, train machine learning models,{" "}
          <br /> and predict outcomes with accuracy and ease.
        </TypographyH4>
      </div>
    </header>
  );
}
