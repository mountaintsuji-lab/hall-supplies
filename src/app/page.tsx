import { SuppliesMainMockup } from "@/components/hall-supplies/supplies-main-mockup";
import { isReadOnlyDeploy } from "@/lib/inventory-fallback-data";
import { getInventoryPageData } from "@/lib/inventory-queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getInventoryPageData();
  return <SuppliesMainMockup data={data} readOnly={isReadOnlyDeploy()} />;
}
