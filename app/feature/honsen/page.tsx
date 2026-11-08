import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "特集：本選ガイド 7日間の投票カレンダー" };

/** 本選の7日間。1キャストへの1日の上限（10票）で、50票に届く日を数える。日付は公式FAQ・案内の表記（11/17〜11/23）による */
const DAYS = [
  { date: "11/17（火）", note: "投票開始 12:00。初日に、同じ枚数のチケットが再付与されます", cum: 10 },
  { date: "11/18（水）", note: "前日に投票した人へ、お礼（投票ありがとうミテネ）を送れます", cum: 20 },
  { date: "11/19（木）", note: "", cum: 30 },
  { date: "11/20（金）", note: "", cum: 40 },
  { date: "11/21（土）", note: "ここで、1人あたり50票に届きます（毎日10票ずつ入れた場合）", cum: 50 },
  { date: "11/22（日）", note: "1キャストへの1ラウンドの上限（50票）に届いたあと。ほかの応援先へ、または新しい応援者へ", cum: 50 },
  { date: "11/23（月）", note: "最終日 23:59まで", cum: 50 },
] as const;

export default function HonsenPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "全国", href: "/" }, { label: "特集", href: "/feature" }, { label: "本選ガイド" }]} />
      <h1>特集：本選ガイド 7日間の投票カレンダー</h1>
      <p className="hint">ブロック本選（11/17〜11/23）を、日ごとの動きで見ていく特集です。公開されている制度の情報をもとにした整理で、結果の予測ではありません。</p>

      <section className="section card prose">
        <h2>先に、3つだけ</h2>
        <ul>
          <li><strong>予選の余った票は、本選では使えません。</strong>本選初日に、同じ枚数のチケットが改めて付与されます（繰越なし）。</li>
          <li><strong>1キャストへは、1日10票まで、本選全体で50票まで。</strong>50票を入れてもらうには、最低でも5日かかります。</li>
          <li><strong>まず目指すのは200人。</strong>ただし200人は称号の条件で、神15の条件ではありません（詳しくは<Link href="/feature">前の特集</Link>）。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>日ごとのカレンダー</h2>
        <p>毎日10票ずつ入れてもらった場合に、1人の応援者から、1キャストへ入る票の累計です。</p>
        <div className="table-wrap">
          <table className="feature-table">
            <thead>
              <tr><th>日付</th><th>1人の累計（最大）</th><th>この日のポイント</th></tr>
            </thead>
            <tbody>
              {DAYS.map((d) => (
                <tr key={d.date}><td className="nowrap">{d.date}</td><td>{d.cum}票</td><td>{d.note || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">倍率（ネット予約を利用した人の票が2倍・3倍）は、集計のときに反映されるため、この表の「票」は使った枚数です。</p>
      </section>

      <section className="section card prose">
        <h2>出場者向け：7日間の動き方</h2>
        <ul>
          <li><strong>初日（11/17）：</strong>投票が始まったことと、「毎日10票まで」を伝えます。最初の呼びかけが、いちばん届きます。</li>
          <li><strong>2〜5日目：</strong>毎日の呼びかけは、「今日の10票」と短く。前日に投票してくれた人へ、お礼を送ります（投票ありがとうミテネ。前日に投票した全員に一括送信、1日1回）。</li>
          <li><strong>5日目（11/21）以降：</strong>すでに50票入れた人には、無理に頼まず、新しい応援者を広げます。</li>
          <li><strong>最終日（11/23）：</strong>23:59までです。夜の呼びかけは、早めに。</li>
          <li><strong>ネット予約の倍率：</strong>投票期間中に、投票先のキャストをネット予約で実際に利用した人の票は3倍です。電話・姫予約は対象外です。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>応援する人向け：票の使い方</h2>
        <ul>
          <li>票は、全キャスト共通の持ち票です。応援先が複数いるなら、毎日少しずつ配ると、全員を応援できます。</li>
          <li>1人に、1日10票までです。使い切れなかった分は、翌日以降に入れられます（期間内なら）。</li>
          <li>最終日にまとめて入れるより、毎日入れたほうが、応援先の進捗（姫デコの「あなたに投票した人数」）に反映されて、励みになります。</li>
        </ul>
      </section>

      <section className="section card prose">
        <h2>確認できていない点</h2>
        <ul>
          <li>本選の終了は、運営者の確認による「11/23(月) 23:59」です。最新の正式告知で確認してください。</li>
          <li>チケットの枚数・上限・倍率は、2026年の公式FAQの表記による整理です。変更されることがあります。</li>
          <li>この特集は有志による非公式のまとめで、公式の見解ではありません。</li>
        </ul>
        <p><Link href="/feature">特集：まず200人、そして15万票へ ›</Link></p>
      </section>
    </>
  );
}
