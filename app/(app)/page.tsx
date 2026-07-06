import { DashboardGreeting } from "@/components/dashboard/greeting";
import { FermentsWidget } from "@/components/dashboard/ferments-widget";
import { InsightsWidget } from "@/components/dashboard/insights-widget";
import { FeaturedTipsWidget } from "@/components/dashboard/featured-tips-widget";
import { LearningWidget } from "@/components/dashboard/learning-widget";
import { ProductsTeaser } from "@/components/dashboard/products-teaser";

export const metadata = {
  title: "Dashboard · Ferment",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <DashboardGreeting />

      {/* Each section is a self-contained widget module. Order is mobile-first:
          your own data first, then discovery, learning, and what's coming. */}
      <FermentsWidget />
      <InsightsWidget />
      <FeaturedTipsWidget />
      <LearningWidget />
      <ProductsTeaser />
    </main>
  );
}
