"""
Step 1: 分析義守大學選課系統登入頁面的表單結構
執行後會印出 form action、所有 input 欄位名稱、隱藏欄位
"""

import requests
from bs4 import BeautifulSoup

URL = "https://netreg.isu.edu.tw/Wapp/Wap_indexmain2.asp"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

resp = requests.get(URL, headers=headers, verify=False)
resp.encoding = resp.apparent_encoding
soup = BeautifulSoup(resp.text, "html.parser")

print("=== 頁面標題 ===")
print(soup.title.text if soup.title else "無")

print("\n=== 所有 Form 標籤 ===")
for i, form in enumerate(soup.find_all("form")):
    print(f"\n[Form {i}]")
    print(f"  action : {form.get('action', '無')}")
    print(f"  method : {form.get('method', '無')}")

    print("  inputs :")
    for inp in form.find_all("input"):
        print(f"    name={inp.get('name')!r:30} type={inp.get('type')!r:12} value={inp.get('value')!r}")

print("\n=== 原始 HTML（前 3000 字）===")
print(resp.text[:3000])
