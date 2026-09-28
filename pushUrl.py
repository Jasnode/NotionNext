#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把「确实发生变化」的博客 URL 推送给搜索引擎。

与旧版的根本区别
----------------
旧版每次都直接把 sitemap 里的全部链接（超过 100 条则随机抽）重推一遍，既没有
变更检测，又在百度 / Bing / IndexNow 三个渠道各跑一次脚本、各自独立随机采样。
这直接违反 IndexNow 规范中「不得推送未变更 URL」的要求 —— 反复重推会训练搜索
引擎忽略本通道，并可能触发限流；百度的每日配额也会被重复推送白白耗尽。

本版改为：抓取线上 sitemap，计算每个页面的内容指纹，与上次成功推送的状态比对，
**只推送新增或内容确实发生变化的 URL**。三个渠道共用同一份变更列表，一次调用完成。

为什么用 sitemap 的 lastmod，而不是抓取页面算指纹
------------------------------------------------
本站由 Notion 驱动，NotionNext 会把每篇文章在 Notion 里的修改时间写进 sitemap 的
<lastmod>。实测二者完全一致（例如 /article/notion 的 lastmod 与页面
article:modified_time 同为 2026-05-30），因此「读一次 sitemap」即可准确判断哪些页面变了：

  旧做法：抓取 65 个页面全文算 SHA-256，约 16MB / 13 秒，每周一次纯属浪费
  新做法：只请求 sitemap.xml（约 9KB），无页面抓取

只有当某条 URL 缺少 lastmod 时（本站目前 65 条都有），才退化为对该 URL 抓取内容
计算指纹，作为兜底。这样既轻量，也不会漏掉无法用时间判断的页面。

风险提示：lastmod 的准确性依赖 NotionNext 的生成逻辑。若将来发现时间没跟着文章
更新，可用 --deep 强制走全量内容指纹做交叉核对。

用法
----
  python pushUrl.py --url https://blog.88lin.eu.org --indexnow_key xxx --dry_run
  python pushUrl.py --url https://blog.88lin.eu.org --force        # 忽略状态全量重推
  python pushUrl.py --url https://blog.88lin.eu.org --check        # 只检查可用性

凭证通过命令行传入。若一个凭证都没有配置，脚本会打印配置指引后正常退出，
不会让 workflow 变红。零第三方依赖，只用标准库。
"""

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
USER_AGENT = "MolingBlog-UrlPush/2.0"
TIMEOUT = 30
MAX_WORKERS = 6
# 百度单批次上限。主动推送接口对单次提交条数有限制，分批可以避免超额报错。
BAIDU_BATCH = 100


def log(message):
    print("[pushUrl] " + str(message), flush=True)


def summary(message):
    """同时输出到运行日志和 GitHub Job Summary。"""
    log(message)
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(str(message) + "\n\n")


# -------------------------------------------------------------- 抓取与解析

class PageParser(HTMLParser):
    """提取页面的 robots 指令与 canonical。"""

    def __init__(self):
        super().__init__()
        self.robots = []
        self.canonicals = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and "canonical" in (attrs.get("rel") or "").lower().split():
            self.canonicals.append(attrs.get("href") or "")
        if tag == "meta" and (attrs.get("name") or "").lower() in {"robots", "bingbot", "googlebot"}:
            self.robots.append(attrs.get("content") or "")


def fetch(url, method="GET", data=None, headers=None):
    """发起 HTTP 请求，返回 (status, body_bytes, response_headers)。

    这里刻意跟随重定向：本博客不存在 .html 扩展名重定向的陷阱，
    强行禁止重定向反而会误伤正常页面。
    """
    request_headers = {"User-Agent": USER_AGENT, "Cache-Control": "no-cache"}
    request_headers.update(headers or {})
    request = urllib.request.Request(
        url, data=data, headers=request_headers, method=method
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        return response.status, response.read(), response.headers


def load_sitemap(site):
    """读取站点 sitemap.xml，返回 [(url, lastmod)]；lastmod 缺失时为 None。"""
    sitemap_url = site.rstrip("/") + "/sitemap.xml"
    status, body, _ = fetch(sitemap_url)
    if status != 200:
        raise RuntimeError(f"sitemap.xml 不可访问，HTTP {status}: {sitemap_url}")

    root = ET.fromstring(body)
    if root.tag != SITEMAP_NS + "urlset":
        raise RuntimeError("解析到的不是 URL 集合，可能是 sitemap 索引文件")

    entries = []
    for node in root.findall(SITEMAP_NS + "url"):
        loc = node.find(SITEMAP_NS + "loc")
        if loc is None or not loc.text:
            continue
        url = loc.text.strip()
        if urlsplit(url).netloc != urlsplit(site).netloc:
            continue
        lastmod_node = node.find(SITEMAP_NS + "lastmod")
        lastmod = lastmod_node.text.strip() if lastmod_node is not None and lastmod_node.text else None
        entries.append((url, lastmod))

    if not entries:
        raise RuntimeError("sitemap.xml 中没有可用 URL")
    return sorted(set(entries))


def load_robots(site):
    """加载 robots.txt；不可用时返回 None，交由调用方放宽处理。"""
    try:
        status, body, _ = fetch(site.rstrip("/") + "/robots.txt")
        if status != 200:
            return None
        parser = urllib.robotparser.RobotFileParser()
        parser.parse(body.decode("utf-8-sig", "replace").splitlines())
        return parser
    except Exception as error:  # robots.txt 缺失不应阻断整个流程
        log(f"robots.txt 读取失败，跳过 robots 校验: {error}")
        return None


def fingerprint(url, robots):
    """抓取单个页面并返回其指纹；被排除或抓取失败时返回 (url, None, 原因)。"""
    try:
        if robots is not None and not robots.can_fetch("Bingbot", url):
            return url, None, "robots.txt 不允许抓取"

        status, body, headers = fetch(url)
        if status != 200:
            return url, None, f"HTTP {status}"

        content_type = (headers.get("Content-Type") or "").lower()
        if "text/html" not in content_type:
            return url, None, f"非 HTML 内容（{content_type or '未知'}）"

        head = body[:400000].decode("utf-8", "replace")  # 只取头部，避免大页面拖慢
        parser = PageParser()
        parser.feed(head)

        directives = " ".join(parser.robots + list(headers.get_all("X-Robots-Tag") or []))
        if re.search(r"\b(noindex|none)\b", directives, re.I):
            return url, None, "页面声明 noindex"

        return url, hashlib.sha256(body).hexdigest(), None
    except urllib.error.HTTPError as error:
        return url, None, f"HTTP {error.code}"
    except Exception as error:
        return url, None, f"抓取失败: {error}"


def build_state(urls, robots):
    """并发抓取全部页面，返回 {url: 指纹} 与被排除清单。"""
    state = {}
    excluded = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = [pool.submit(fingerprint, url, robots) for url in urls]
        for future in concurrent.futures.as_completed(futures):
            url, digest, reason = future.result()
            if digest is None:
                excluded.append((url, reason))
            else:
                state[url] = digest
    return state, excluded


# -------------------------------------------------------------- 推送渠道

def push_indexnow(site, urls, api_key):
    """IndexNow 推送，覆盖 Bing / Yandex / Seznam / Naver / Yep。Google 不参与。"""
    if not urls:
        return True
    payload = {
        "host": urlsplit(site).netloc,
        "key": api_key,
        "keyLocation": f"{site.rstrip('/')}/{api_key}.txt",
        "urlList": urls,
    }
    request = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            status = response.status
            log(f"IndexNow HTTP {status}：已接收 {len(urls)} 条。"
                + ("（202 表示待所有权校验，稍后会重推）" if status == 202 else ""))
            return status in (200, 202)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace") if error.fp else ""
        log(f"IndexNow 推送失败 HTTP {error.code}: {detail}")
        return False
    except Exception as error:
        log(f"IndexNow 推送异常: {error}")
        return False


def push_baidu(site, urls, token):
    """百度主动推送。分批提交，避免超过单次条数与配额限制。"""
    if not urls:
        return True
    endpoint = "http://data.zz.baidu.com/urls?site={0}&token={1}".format(
        site.rstrip("/") + "/", token
    )
    ok = True
    for start in range(0, len(urls), BAIDU_BATCH):
        batch = urls[start:start + BAIDU_BATCH]
        request = urllib.request.Request(
            endpoint,
            data="\n".join(batch).encode("utf-8"),
            headers={"Content-Type": "text/plain"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                result = json.loads(response.read().decode("utf-8", "replace"))
                if "success" in result:
                    log(f"百度推送成功 {len(batch)} 条，剩余配额 {result.get('remain', '未知')}")
                else:
                    log(f"百度推送失败: {result}")
                    ok = False
                    break  # 配额耗尽或 token 失效时，继续重试没有意义
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace") if error.fp else ""
            log(f"百度推送失败 HTTP {error.code}: {detail}")
            ok = False
            break
        except Exception as error:
            log(f"百度推送异常: {error}")
            ok = False
            break
    return ok


def push_bing(site, urls, api_key):
    """Bing Webmaster Tools 批量提交接口。"""
    if not urls:
        return True
    endpoint = "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey={0}".format(api_key)
    request = urllib.request.Request(
        endpoint,
        data=json.dumps({"siteUrl": site.rstrip("/") + "/", "urlList": urls}).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            log(f"Bing 推送成功 {len(urls)} 条。")
            return True
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace") if error.fp else ""
        log(f"Bing 推送失败 HTTP {error.code}: {detail}")
        return False
    except Exception as error:
        log(f"Bing 推送异常: {error}")
        return False


# -------------------------------------------------------------- 主流程

def main():
    parser = argparse.ArgumentParser(description="增量推送变更 URL 到搜索引擎")
    parser.add_argument("--url", default=os.environ.get("URL", ""), help="站点地址，如 https://blog.88lin.eu.org")
    parser.add_argument("--baidu_token", default=os.environ.get("BAIDU_TOKEN", ""))
    parser.add_argument("--bing_api_key", default=os.environ.get("BING_API_KEY", ""))
    parser.add_argument("--indexnow_key", default=os.environ.get("INDEXNOW_KEY", ""))
    parser.add_argument("--state_dir", default=os.environ.get("STATE_DIR", ".cache/pushurl"),
                        help="存放上次推送指纹的目录")
    parser.add_argument("--force", action="store_true", help="忽略历史状态，全量重推")
    parser.add_argument("--dry_run", action="store_true", help="只预览将推送的内容，不实际发送")
    parser.add_argument("--check", action="store_true", help="只检查站点可用性，不做推送")
    parser.add_argument("--deep", action="store_true",
                        help="忽略 lastmod，抓取全部页面用内容指纹判定（用于交叉核对 lastmod 是否可信）")
    args = parser.parse_args()

    site = args.url.strip().rstrip("/")
    if not site:
        summary("未配置站点地址。请在仓库 Settings → Secrets and variables → Actions 中添加 URL。")
        return 0

    # 渠道说明：
    #   IndexNow  —— 当前唯一启用的渠道，一次推送即覆盖 Bing / Yandex / Seznam / Naver，足够覆盖必应。
    #   百度      —— 暂时停用。站点当前无法在百度站长平台添加，等可添加并拿到 token 后再配置
    #                BAIDU_TOKEN，无需改动代码即可自动恢复。
    #   Bing API  —— 备选，需 Bing Webmaster Tools 的 key。IndexNow 已能覆盖必应，通常不必再配。
    channels = {
        "IndexNow": (args.indexnow_key, push_indexnow),
        "Baidu": (args.baidu_token, push_baidu),      # 暂时停用：站点未在百度站长平台添加
        "Bing": (args.bing_api_key, push_bing),       # 备选，不配则不启用
    }
    enabled = {name: fn for name, (token, fn) in channels.items() if token}
    if not enabled:
        summary(
            "没有任何渠道凭证，本次不推送。\n\n"
            "当前推荐使用 IndexNow（覆盖 Bing / Yandex / Seznam / Naver）。\n"
            "请到仓库 Settings → Secrets and variables → Actions 配置:\n"
            "- INDEXNOW_KEY\n"
            "  同时需要在站点根目录放置 https://blog.88lin.eu.org/<key>.txt，文件内容即该 key 本身。\n\n"
            "以下为暂时未启用的渠道：\n"
            "- BAIDU_TOKEN：百度暂时无法添加站点，待添加后再配置\n"
            "- BING_API_KEY：备选，IndexNow 已可覆盖必应，通常无需配置"
        )
        return 0

    try:
        entries = load_sitemap(site)
    except Exception as error:
        summary(f"错误：{error}")
        return 1

    with_lastmod = [e for e in entries if e[1]]
    without_lastmod = [url for url, lastmod in entries if not lastmod]
    summary(
        f"线上 sitemap 共 {len(entries)} 条 URL，已启用渠道：{', '.join(enabled.keys())}\n"
        f"其中 {len(with_lastmod)} 条自带 lastmod，可直接比对；"
        f"{len(without_lastmod)} 条缺少 lastmod，需抓取页面计算指纹。"
    )

    if args.check:
        log("--check 模式，站点可访问，不做推送。")
        return 0

    # 默认依据 lastmod 判定变更，不抓取页面；--deep 时改为全量内容指纹做交叉核对。
    current = {}
    excluded = []
    if args.deep:
        log("--deep 模式：改为抓取全部页面计算内容指纹（较慢，仅用于交叉核对 lastmod 是否可信）。")
        robots = load_robots(site)
        current, excluded = build_state([url for url, _ in entries], robots)
    else:
        for url, lastmod in entries:
            current[url] = lastmod
        if without_lastmod:
            robots = load_robots(site)
            fallback, excluded = build_state(without_lastmod, robots)
            current.update(fallback)

    if excluded:
        summary("以下 URL 被排除：" + "\n".join(f"- {url}（{reason}）" for url, reason in sorted(excluded)))

    state_file = Path(args.state_dir) / "state.json"
    previous = {}
    if state_file.exists() and not args.force:
        try:
            previous = json.loads(state_file.read_text(encoding="utf-8"))
        except Exception as error:
            log(f"历史状态读取失败，本次按全量处理: {error}")

    bootstrap = not previous
    changed = sorted(url for url, digest in current.items() if previous.get(url) != digest)

    if not changed:
        summary("没有新增或变更的页面，本次不推送任何 URL（这正是期望行为：不重复推送未变更内容）。")
        return 0

    if bootstrap:
        summary(f"首次运行，未找到历史状态，将以 {len(changed)} 条 URL 建立基线。此后的运行只推增量。")
    else:
        summary(f"检测到 {len(changed)} 条新增或变更的页面。")

    if args.dry_run:
        summary("dry_run 模式，将推送：\n" + "\n".join(f"- {url}" for url in changed))
        return 0

    results = {}
    for name, push in enabled.items():
        results[name] = push(site, changed, channels[name][0])
    failed = [name for name, ok in results.items() if not ok]

    if failed:
        # 不保存状态，让下一次运行自动重试失败的渠道。
        summary(f"以下渠道推送失败，本次不保存状态，下次将自动重试：{', '.join(failed)}")
        return 1

    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
    summary(f"全部渠道推送成功，共 {len(changed)} 条。已更新状态记录。")

    # 通知 workflow 写回缓存；未推送成功时不写，避免产生无意义的缓存条目。
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write("pushed=true\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
