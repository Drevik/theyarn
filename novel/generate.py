#!/usr/bin/env python3
"""Generate novel reader HTML pages from markdown chapter drafts."""
import os, json, re

NOVELS_DIR = "/home/Drevik/novels/acolytes-ascent"
SITE_DIR = "/home/Drevik/vault/Affiliate/site/novel"

with open(os.path.join(NOVELS_DIR, "progress.json")) as f:
    progress = json.load(f)

def load_outline(book_num):
    path = os.path.join(NOVELS_DIR, "outlines", f"book-{book_num}-outline.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

def md_to_html(text):
    lines = text.split("\n")
    html_lines = []
    in_paragraph = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            if in_paragraph:
                html_lines.append("</p>")
                in_paragraph = False
            html_lines.append(f"<h1>{stripped[2:]}</h1>")
        elif stripped.startswith("## "):
            if in_paragraph:
                html_lines.append("</p>")
                in_paragraph = False
            html_lines.append(f"<h2>{stripped[3:]}</h2>")
        elif stripped.startswith("### "):
            if in_paragraph:
                html_lines.append("</p>")
                in_paragraph = False
            html_lines.append(f"<h3>{stripped[4:]}</h3>")
        elif stripped in ("---", "***", "___"):
            if in_paragraph:
                html_lines.append("</p>")
                in_paragraph = False
            html_lines.append("<hr>")
        elif stripped == "":
            if in_paragraph:
                html_lines.append("</p>")
                in_paragraph = False
        else:
            formatted = stripped
            formatted = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", formatted)
            formatted = re.sub(r"\*(.+?)\*", r"<em>\1</em>", formatted)
            formatted = formatted.replace("---", "\u2014").replace("--", "\u2013")
            if not in_paragraph:
                html_lines.append(f"<p>{formatted}")
                in_paragraph = True
            else:
                html_lines.append(formatted)
    if in_paragraph:
        html_lines.append("</p>")
    return "\n".join(html_lines)

def get_chapter_title(book_num, chapter_num):
    outline = load_outline(book_num)
    if outline and "chapters" in outline:
        for ch in outline["chapters"]:
            if ch.get("chapter_num") == chapter_num:
                return ch.get("title", f"Chapter {chapter_num}")
    return f"Chapter {chapter_num}"

# Collect all chapters
all_chapters = []
for book in progress["books"]:
    bn = book["book_number"]
    draft_dir = os.path.join(NOVELS_DIR, "drafts", f"book-{bn}")
    if os.path.isdir(draft_dir):
        for f in sorted(os.listdir(draft_dir)):
            if f.endswith(".md"):
                cn = int(f.replace("chapter-", "").replace(".md", ""))
                all_chapters.append((bn, cn))

print(f"Found {len(all_chapters)} chapters")

generated = 0
for i, (bn, cn) in enumerate(all_chapters):
    md_path = os.path.join(NOVELS_DIR, "drafts", f"book-{bn}", f"chapter-{cn:02d}.md")
    with open(md_path) as f:
        md_content = f.read()
    word_count = len(md_content.split())
    chapter_title = get_chapter_title(bn, cn)
    html_content = md_to_html(md_content)

    prev_info = all_chapters[i-1] if i > 0 else None
    next_info = all_chapters[i+1] if i < len(all_chapters)-1 else None

    book_info = progress["books"][bn - 1]
    book_title = book_info["title"]
    status = book_info.get("status", "draft")

    prev_link = f"../book-{prev_info[0]}/chapter-{prev_info[1]:02d}.html" if prev_info else "#"
    prev_class = "" if prev_info else " disabled"
    prev_label = f"\u2190 Ch {prev_info[1]}" if prev_info else "\u2190 Start"
    next_link = f"../book-{next_info[0]}/chapter-{next_info[1]:02d}.html" if next_info else "#"
    next_class = "" if next_info else " disabled"
    next_label = f"Ch {next_info[1]} \u2192" if next_info else "End \u2192"

    status_badge = ""
    if status == "in_progress":
        status_badge = '<span class="book-status in-progress">Draft</span>'
    elif status == "complete":
        status_badge = '<span class="book-status complete">Complete</span>'

    html_page = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book {bn}, Chapter {cn}: {chapter_title} &mdash; The Acolyte&apos;s Ascent</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="stylesheet" href="../css/novel-reader.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div id="password-gate" class="password-gate">
        <div class="password-box">
            <h2>&#128274; The Acolyte&apos;s Ascent</h2>
            <p>This manuscript is password-protected.</p>
            <form id="password-form">
                <input type="password" id="password-input" placeholder="Enter password" autocomplete="off" autofocus>
                <button type="submit">Enter</button>
            </form>
            <div id="password-error" class="password-error">Incorrect password</div>
        </div>
    </div>
    <div id="novel-app" class="novel-app">
        <nav class="novel-nav">
            <div class="novel-nav-left">
                <a href="../" class="novel-nav-title">The Acolyte&apos;s Ascent</a>
                <span class="novel-nav-book">Book {bn}: {book_title} {status_badge}</span>
            </div>
            <div class="novel-nav-right">
                <a href="../" class="novel-nav-btn">Index</a>
                <span class="novel-nav-btn" style="opacity:0.5;cursor:default">{word_count:,} words</span>
            </div>
        </nav>
        <div class="novel-progress"><div class="novel-progress-fill"></div></div>
        <main class="novel-content">
            {html_content}
        </main>
        <div class="chapter-nav">
            <a href="{prev_link}" class="prev{prev_class}">{prev_label}</a>
            <a href="{next_link}" class="next{next_class}">{next_label}</a>
        </div>
        <div class="editor-notes">
            <h3>&#128221; Editor Notes</h3>
            <textarea data-chapter="book{bn}-ch{cn}" placeholder="Write your editorial notes for this chapter..."></textarea>
            <div class="editor-notes-actions">
                <button class="save-btn">Save Notes</button>
                <button class="clear-btn">Clear</button>
                <span class="saved-msg">&#10003; Saved</span>
            </div>
        </div>
    </div>
    <script src="../js/auth.js"></script>
</body>
</html>"""

    out_dir = os.path.join(SITE_DIR, f"book-{bn}")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"chapter-{cn:02d}.html")
    with open(out_path, "w") as f:
        f.write(html_page)
    generated += 1

print(f"Generated {generated} chapter pages")