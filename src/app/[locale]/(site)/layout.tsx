import { Nav } from "@/components/Nav";
import { getSiteSettings } from "@/lib/catalog";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { whatsappNumber } = await getSiteSettings();
  return (
    <>
      <Nav whatsappNumber={whatsappNumber} />
      {children}
    </>
  );
}
