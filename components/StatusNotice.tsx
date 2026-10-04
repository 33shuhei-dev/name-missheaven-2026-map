import type { Stats } from "@/lib/model";

/** 確認済みデータが少ない／ない場合の注意表示（データから自動判定） */
export function StatusNotice({ stats }: { stats: Stats }) {
  if (stats.recordCount === 0) {
    return <p className="notice">現在、掲載している情報はありません。</p>;
  }
  if (stats.byConfidence.confirmed === 0) {
    return (
      <p className="notice notice--warn">
        現在の掲載情報には<strong>確認済み（一次情報で確認）のものがありません</strong>。
        表示されている情報は調査候補であり、事実と確認できていません。
      </p>
    );
  }
  return null;
}
