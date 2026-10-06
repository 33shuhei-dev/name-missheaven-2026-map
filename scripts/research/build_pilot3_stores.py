"""3県パイロット：新規店舗（status=add）と既存店舗の掲載地域補完を repo のデータに書き出す。"""
import json, hashlib
from analyze import PREF_NAME
REPO = "/home/user/name-missheaven-2026-map"
items = {o["cid"]: o for o in json.load(open("pilot3_items.json"))}
ver = json.load(open("pilot3_verified.json")); nk = json.load(open("pilot3_newkeys.json"))
ROLE = {"own_page": ("entrant_diary", "entrant_page"), "own_diary": ("entrant_diary", "entrant_page"), "other_entrant": ("entrant_diary", "entrant_page"),
        "store_notice": ("store", "store_announcement"), "store_page": ("store", "store_public_page")}
stores, sources = [], {}
def src_for(cid, sid):
    it = items[cid]; url = it["url"]
    if url not in sources:
        kind = next((p["kind"] for p in ver["persons"] if p["cid"] == cid), None)
        stype, role = ROLE.get(kind, ("store", "store_public_page")) if kind else (("entrant_diary", "entrant_page") if "girlid-" in url else ("store", "store_public_page"))
        sources[url] = dict(sourceId=f"pl3-src-{len(sources) + 1:04d}", url=url, sourceType=stype, accessStatus="search_index_only", publisherRole=role,
                            storeIds=[], relationIds=[], checkedAt="2026-10-06",
                            notes="3県パイロット（2026-10-06）のYahoo!検索の結果の抜粋で、2026年の参加を示す記載を確認（ページ本文は調査環境から取得していない）。")
    s = sources[url]
    if sid not in s["storeIds"]: s["storeIds"].append(sid)
    return s["sourceId"]
for k, v in sorted(nk.items()):
    if v["status"] != "add": continue
    sid = "mh26-pl3-store-" + hashlib.sha256(k.encode()).hexdigest()[:16]
    cids = list(dict.fromkeys(c for c, _ in ver["store_ev"][k]))
    sids = list(dict.fromkeys(src_for(c, sid) for c in cids))
    n = len(sids); pref = PREF_NAME[k.split("/")[0]]
    stores.append(dict(storeId=sid, storeName=v["name"], storeNameOriginals=[v["name"]], prefecture=pref,
        listingArea=v["area"], listingAreas=[v["area"]] if v["area"] else [], formalElectionArea=None, categoryOriginal=None, categoryOriginals=[],
        participationEvidenceUrl=items[cids[0]]["url"], storePublicUrl=f"https://www.cityheaven.net/{k}/",
        sourceType=sources[items[cids[0]]["url"]]["sourceType"], confidence="probable" if n >= 2 else "unverified",
        participationType="search_index_reported", checkedAt="2026-10-06", phase1RecordIds=[], phase2RecordIds=[], isNewSincePhase1=True,
        sourceIds=sids, publicUrlAccessStatus="unknown", verificationMethod="search_index_multiple" if n >= 2 else "search_index_single",
        evidencePageCount=n, cityheavenKey=k,
        notes="3県パイロット（2026-10-06）。Yahoo!検索の結果で、ヘブン掲載のこの店舗のページに2026年の参加・出場を示す記載を確認（" + str(n) + "ページ）。ページ本文は取得していないため検索結果の抜粋による。都道府県・公開ページURLはヘブンの掲載URL（店舗キー）、掲載地域はページタイトルの表記による（タイトルにない場合は未判明のまま）。正式選挙エリアは未確認。"))
# 既存店舗の掲載地域補完（店舗キー・店名が一致するページタイトルの地域表記だけ）
area_src = dict(sourceId="pl3-src-area-0001", url="https://www.cityheaven.net/miyagi/A0401/A040101/s-style-club/girlid-47887569/", sourceType="entrant_diary",
                accessStatus="search_index_only", publisherRole="entrant_page", storeIds=["mh26-p3b-store-3ae81f8f4a771fab"], relationIds=[], checkedAt="2026-10-06",
                notes="3県パイロット（2026-10-06）のYahoo!検索の結果。ページタイトル「…エススタイルクラブ - 青葉区・国分町/デリヘル」（店舗キー miyagi/A0401/A040101/s-style-club が既存店舗と一致）。")
out = dict(description="3都道府県パイロット（大阪府・宮城県・青森県、2026-10-06）で新たに確認した参加関連店舗と、既存店舗の掲載地域の補完。人物名はここに書かない。",
           stores=stores, relations=[], sources=list(sources.values()) + [area_src],
           listingAreaUpdates=[dict(storeId="mh26-p3b-store-3ae81f8f4a771fab", listingArea="青葉区・国分町", sourceIds=["pl3-src-area-0001"],
                                    notes="エススタイルクラブ。ページタイトルの掲載地域表記による（正式選挙エリアではない）。")])
json.dump(out, open(f"{REPO}/data/stores/pilot3-2026-10-06.json", "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(stores), Counter(s["prefecture"] for s in stores), Counter(s["confidence"] for s in stores), "areas", sum(1 for s in stores if s["listingArea"]), "sources", len(sources))
