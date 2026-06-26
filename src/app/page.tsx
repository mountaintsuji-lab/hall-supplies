import { SuppliesMainMockup } from "@/components/hall-supplies/supplies-main-mockup";
import { getSession, isAuthEnabled } from "@/lib/auth";
import { getInventoryPageData } from "@/lib/inventory-queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ data, readOnly, banner }, session] = await Promise.all([
    getInventoryPageData(),
    getSession(),
  ]);
  return (
    <SuppliesMainMockup
      data={data}
      readOnly={readOnly}
      banner={banner}
      userRole={session?.role ?? "field"}
      authEnabled={isAuthEnabled()}
    />
  );
}
