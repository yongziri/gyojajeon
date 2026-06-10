# -*- coding: utf-8 -*-
# WBI(HTML) USB 제출용 '자체완결' 빌드.
#  · 게임이 로드하는 이미지/스프라이트시트를 data:URI로 인라인(assets-inline.js)해서
#    file:// 더블클릭만으로 그림이 정상 표시되게 한다(Phaser XHR 이미지 로딩 우회).
#  · 오디오(mp3)·폰트(woff2)·JS·CSS는 file://에서 그대로 동작하므로 파일로 둔다.
import os, re, base64, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, 'usb')

def rel(*p): return os.path.join(ROOT, *p)

# 1) game.js에서 실제 로드하는 이미지/스프라이트시트 URL 수집
src = open(rel('src', 'game.js'), encoding='utf-8').read()
urls = set()
for pat in [r"load\.image\(\s*'[^']*'\s*,\s*'([^']+)'",
            r"load\.spritesheet\(\s*'[^']*'\s*,\s*'([^']+)'"]:
    for m in re.finditer(pat, src):
        urls.add(m.group(1))
urls = sorted(urls)

EXT_MIME = {'.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
            '.webp':'image/webp', '.gif':'image/gif'}

# 2) data:URI 맵 생성
entries = []
total = 0
for u in urls:
    fp = rel(*u.split('/'))
    if not os.path.exists(fp):
        print('  MISSING (건너뜀):', u); continue
    ext = os.path.splitext(u)[1].lower()
    mime = EXT_MIME.get(ext, 'application/octet-stream')
    data = open(fp, 'rb').read(); total += len(data)
    b64 = base64.b64encode(data).decode('ascii')
    entries.append("  '%s': 'data:%s;base64,%s'" % (u, mime, b64))
print('인라인 이미지 %d개, 원본 %.2f MB' % (len(entries), total/1048576))

# 3) 출력 폴더 준비 (이전 빌드 산출물만 정리)
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

inline_js = 'window.IMG_DATA = {\n' + ',\n'.join(entries) + '\n};\n'
open(os.path.join(OUT, 'assets-inline.js'), 'w', encoding='utf-8').write(inline_js)
print('assets-inline.js 작성: %.2f MB' % (os.path.getsize(os.path.join(OUT,'assets-inline.js'))/1048576))

# 4) 런타임 파일 복사
for f in ['manifest.webmanifest', 'sw.js']:
    shutil.copy2(rel(f), os.path.join(OUT, f))
for d in ['src', 'vendor', 'assets']:
    shutil.copytree(rel(d), os.path.join(OUT, d))

# 5) index.html 복사 + assets-inline.js 주입(게임 스크립트보다 먼저 로드)
html = open(rel('index.html'), encoding='utf-8').read()
needle = '<script src="src/game.js"></script>'
inject = '<script src="assets-inline.js"></script>\n  ' + needle
assert needle in html, 'index.html에서 game.js 스크립트 태그를 못 찾음'
html = html.replace(needle, inject, 1)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)

# 6) 실행 안내문
guide = (
    'P.E.A.C.E. — WBI 학습자료 실행 방법\n'
    '====================================\n\n'
    '1) 이 폴더(usb) 전체를 USB에 복사하세요.\n'
    '2) index.html 을 더블클릭하면 브라우저에서 바로 실행됩니다.\n'
    '   (인터넷 연결이 없어도 됩니다. 그림·소리 모두 정상 동작)\n\n'
    '권장 브라우저: 크롬, 엣지 (최신판)\n'
    '전체화면: 실행 후 F11\n\n'
    '※ 교사용 실시간 대시보드는 인터넷이 있을 때만 동작합니다(선택 기능).\n'
)
open(os.path.join(OUT, '실행방법.txt'), 'w', encoding='utf-8').write(guide)

# 7) 산출물 요약
def dirsize(p):
    t=0
    for r,_,fs in os.walk(p):
        for f in fs: t+=os.path.getsize(os.path.join(r,f))
    return t
print('usb/ 총 용량: %.1f MB' % (dirsize(OUT)/1048576))
print('완료 → usb/ 폴더를 USB에 복사하세요.')
