import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Star } from "lucide-react";

export function StarsChamber({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <ChamberLayout title={t("chamberPages.stars.title")} subtitle={t("chamberPages.stars.subtitle")} onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Star className="w-10 h-10 mx-auto text-gold" />
        <p className="text-sm text-muted-foreground">
          {t("chamberPages.stars.placeholder")}
        </p>
      </div>
    </ChamberLayout>
  );
}
