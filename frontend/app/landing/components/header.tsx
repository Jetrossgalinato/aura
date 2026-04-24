import { TypographyH1, TypographyH4 } from "@/components/typography";
import { Skeleton } from "@/components/ui/skeleton";

type HeaderProps = {
  isLoading?: boolean;
};

export default function Header({ isLoading = false }: HeaderProps) {
  if (isLoading) {
    return (
      <header className="mt-18 flex-row gap-4 text-center">
        <div className="mb-4 flex justify-center">
          <Skeleton className="h-12 w-[min(90vw,42rem)]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-5 w-[min(85vw,34rem)]" />
          <Skeleton className="h-5 w-[min(70vw,26rem)]" />
        </div>
      </header>
    );
  }

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
