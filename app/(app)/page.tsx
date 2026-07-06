import { FermentsWidget } from "@/components/dashboard/ferments-widget";
import { FeaturedTipsWidget } from "@/components/dashboard/featured-tips-widget";
import { LearningWidget } from "@/components/dashboard/learning-widget";
import { ProductsTeaser } from "@/components/dashboard/products-teaser";

export const metadata = {
  title: "Dashboard · Ferment",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-secondary">
          Your ferments, learning, and what&apos;s new — all in one place.
        </p>
      </header>

      {/* Each section is a self-contained widget module. Order is mobile-first:
          your own data first, then discovery, learning, and what's coming. */}
      <FermentsWidget />
      <FeaturedTipsWidget />
      <LearningWidget />
      <ProductsTeaser />
    </main>
  );
}
