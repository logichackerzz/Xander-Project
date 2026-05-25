"""
義守大學選課系統爬蟲
登入後抓取課程資料，輸出為 JSON
"""

import requests
import json
import getpass
from bs4 import BeautifulSoup

BASE_URL = "https://netreg.isu.edu.tw/Wapp"
LOGIN_URL = f"{BASE_URL}/wap_check_test.asp"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": f"{BASE_URL}/Wap_indexmain2.asp",
    "Content-Type": "application/x-www-form-urlencoded",
}

def login(session, student_id, password):
    payload = {
        "logon_id": student_id,
        "txtpasswd": password,
        "language": "zh_TW",
        "lange_sel": "zh_TW",
    }
    resp = session.post(LOGIN_URL, data=payload, headers=HEADERS, verify=False, allow_redirects=True)
    resp.encoding = resp.apparent_encoding
    return resp

def parse_page(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup

def main():
    print("=== 義守大學選課系統爬蟲 ===\n")
    student_id = input("學號: ").strip()
    password = getpass.getpass("密碼: ")

    session = requests.Session()

    print("\n[1/3] 登入中...")
    resp = login(session, student_id, password)

    soup = parse_page(resp.text)
    title = soup.title.text.strip() if soup.title else "無標題"
    print(f"      頁面標題: {title}")
    print(f"      最終 URL : {resp.url}")

    # 判斷登入結果
    if "logon_id" in resp.text or "txtpasswd" in resp.text:
        print("\n[!] 登入失敗，請確認帳號密碼")
        print("    原始回應（前 500 字）:")
        print(resp.text[:500])
        return

    print("[2/3] 登入成功！分析選單...")
    links = []
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        href = a["href"]
        if text and not href.startswith("http"):
            links.append({"text": text, "href": href})

    print(f"      找到 {len(links)} 個內部連結")

    print("\n[3/3] 輸出結果")
    result = {
        "login_url": resp.url,
        "page_title": title,
        "menu_links": links,
        "raw_html_preview": resp.text[:2000],
    }

    with open("result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("      結果已存到 result.json")
    print("\n=== 選單連結 ===")
    for lk in links[:20]:
        print(f"  {lk['text']:20} → {lk['href']}")

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings()
    main()
