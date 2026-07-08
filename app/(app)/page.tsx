import { DashboardGreeting } from "@/components/dashboard/greeting";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { FeaturedTipsWidget } from "@/components/dashboard/featured-tips-widget";
import { LearningWidget } from "@/components/dashboard/learning-widget";

export const metadata = {
  title: "Dashboard · Ferment",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <DashboardGreeting />

      {/* Hierarchy, top to bottom: hero (what needs you now) → primary (your
          ferments) → ambient (craft insight, then discovery/learning). Whitespace
          — not borders — separates the tiers. The Shop teaser stays out until
          it's real rather than shipping "coming soon" dead space. */}
      <HomeDashboard />

      <FeaturedTipsWidget />
      <LearningWidget />
    </main>
  );
}
