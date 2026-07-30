import type { Metadata } from "next";

import { FarmFooter } from "@/components/farm/farm-footer";
import { FarmNav } from "@/components/farm/farm-nav";
import "./farm.css";

export const metadata: Metadata = {
  title: {
    default: "Run-a-Muck Farms — Local flowers, grown to order",
    template: "%s · Run-a-Muck Farms",
  },
};

export default function FarmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rm-site">
      <FarmNav />
      <main className="rm-main">{children}</main>
      <FarmFooter />
    </div>
  );
}
