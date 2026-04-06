import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Hash } from "lucide-react";

export function NumbersChamber({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <ChamberLayout title={t("chamberPages.numbers.title")} subtitle={t("chamberPages.numbers.subtitle")} onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Hash className="w-10 h-10 mx-auto text-gold" />
        <p className="text-sm text-muted-foreground">
          {t("chamberPages.numbers.placeholder")}
        </p>
      </div>
    </ChamberLayout>
  );
}
