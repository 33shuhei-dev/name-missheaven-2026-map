import re,html,json,subprocess,time,sys,os
OUT=sys.argv[1]; RAW=sys.argv[2]
AREAS={"hokkaido_tohoku":"北海道・東北","kanto":"関東","chubu":"中部","kansai":"関西","chugoku_shikoku":"中国・四国","kyushu_okinawa":"九州・沖縄"}
rows=[]; pages=[]
for kind,base in [("fuzoku","https://ranking-deli.jp/missekichika/{a}/"),("menesth","https://ranking-deli.jp/missekichika/menesth/{a}/")]:
    for a,an in AREAS.items():
        u=base.format(a=a); f=os.path.join(RAW,f"{kind}_{a}.html")
        if not os.path.exists(f):
            subprocess.run(["curl","-sS","-L","--compressed","-A","Mozilla/5.0","-o",f,u]); time.sleep(1.5)
        b=open(f,encoding="utf-8",errors="replace").read()
        res="preliminary_result" in b
        secs=re.split(r'<section id="',b)[1:]
        n=0
        for sec in secs:
            div=re.search(r'class="title_img">\s*<img[^>]*alt="([^"]+)"',sec)
            div=div.group(1).replace("部門","") if div else ("メンズエステ" if kind=="menesth" else "?")
            for li in re.split(r'<li class="listItem">',sec)[1:]:
                rk=re.search(r'class="word-bigger">(\d+)<',li); gid=re.search(r'data-girl-id="(\d+)"',li)
                url=re.search(r'href="(https://ranking-deli\.jp/[a-z]+/area\d+/style\d+/\d+/\d+/)"',li)
                gtm=re.search(r'data-gtm-misseki="([^"]*)"',li)
                if not gid: continue
                parts=html.unescape(gtm.group(1)).split("_") if gtm else []
                rows.append(dict(kind=kind,area=an,division=div,rank=int(rk.group(1)) if rk else None,girl_id=gid.group(1),girl_url=url.group(1) if url else "",
                                 name=parts[0] if parts else "",shop=parts[1] if len(parts)>1 else "",pref=parts[2] if len(parts)>2 else "",station=parts[3] if len(parts)>3 else ""))
                n+=1
        pages.append(dict(url=u,kind=kind,area=an,result=res,items=n,title=re.search(r'<title>(.*?)</title>',b,re.S).group(1).strip()))
json.dump(dict(pages=pages,rows=rows),open(OUT,"w"),ensure_ascii=False,indent=1)
for p in pages: print(p["kind"],p["area"],p["result"],p["items"])
print("rows",len(rows),"unique girls",len({r["girl_id"] for r in rows}))
