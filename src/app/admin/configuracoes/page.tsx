import { getStoreSettings } from "@/lib/shipping";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Configurações</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
