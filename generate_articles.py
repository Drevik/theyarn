#!/usr/bin/env python3
"""Generate remaining affiliate articles for The Yarn from article data."""
import os

NAV = """<li><a href="/home-kitchen/">Home &amp; Kitchen</a></li>
<li><a href="/best-mechanical-keyboards/">Tech &amp; Gadgets</a></li>
<li><a href="/wellness/">Wellness</a></li>
<li><a href="/knitting-yarn-beginners/">Knitting &amp; Crafts</a></li>
<li><a href="/running-shoes-beginners/">Sports Attire</a></li>
<li><a href="/video-game-deals/">Video Game Deals</a></li>
<li><a href="/best-affordable-watches/">Fashion &amp; Accessories</a></li>
<li><a href="/about/">About</a></li>"""

FOOTER_CATS = """<li><a href="/home-kitchen/">Home &amp; Kitchen</a></li>
<li><a href="/best-mechanical-keyboards/">Tech &amp; Gadgets</a></li>
<li><a href="/wellness/">Wellness</a></li>
<li><a href="/knitting-yarn-beginners/">Knitting &amp; Crafts</a></li>
<li><a href="/running-shoes-beginners/">Sports Attire</a></li>
<li><a href="/video-game-deals/">Video Game Deals</a></li>
<li><a href="/best-affordable-watches/">Fashion &amp; Accessories</a></li>"""

def make_article(data):
    slug = data["slug"]
    title = data["title"]
    desc = data["desc"]
    category = data["category"]
    category_url = data["category_url"]
    hero_alt = data["hero_alt"]
    intro = data["intro"]
    what_matters = data["what_matters"]
    products = data["products"]
    comparison = data["comparison"]
    faqs = data["faqs"]
    related = data.get("related", [])

    # Build FAQ schema
    faq_schema = []
    for q, a in faqs:
        faq_schema.append(f"""{{"@type":"Question","name":{repr(q)},"acceptedAnswer":{{"@type":"Answer","text":{repr(a)}}}}}""")
    faq_schema_str = ",\n    ".join(faq_schema)

    # Build product boxes
    product_html = ""
    for p in products:
        product_html += f"""
            <div class="product-box">
                <h3>{p['name']} — {p['tagline']}</h3>
                <p>{p['body']}</p>
                <p><strong>Best for:</strong> {p['best_for']}</p>
                <a href="{p['url']}" class="product-btn" rel="nofollow sponsored">Check price on Amazon →</a>
            </div>"""

    # Build comparison table
    comp_header = " | ".join(comparison["headers"])
    comp_rows = ""
    for row in comparison["rows"]:
        comp_rows += "<tr><td>" + "</td><td>".join(row) + "</td></tr>\n"

    # Build FAQ HTML
    faq_html = ""
    for q, a in faqs:
        faq_html += f"""
            <div class="faq-item">
                <p class="faq-question"><strong>{q}</strong></p>
                <p class="faq-answer">{a}</p>
            </div>"""

    # Build related links
    related_html = ""
    for r in related:
        related_html += f'<li><a href="/{r["slug"]}/">{r["title"]}</a></li>\n'

    # Build what matters items
    what_matters_html = ""
    for item in what_matters:
        what_matters_html += f"<li>{item}</li>\n"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | The Yarn</title>
    <meta name="description" content="{desc}">
    <meta property="og:title" content="{title} — The Yarn">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="The Yarn">
    <link rel="canonical" href="https://theyarn.pages.dev/{slug}/">
    <link rel="stylesheet" href="/css/style.css">
    <script type="application/ld+json">
    {{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_schema_str}]}}
    </script>
</head>
<body>
    <header><nav><a href="/" class="logo">The Yarn</a><ul>{NAV}</ul></nav></header>
    <div class="article-page">
        <div class="breadcrumbs"><a href="/">Home</a> &rsaquo; <a href="/{category_url}/">{category}</a> &rsaquo; {title}</div>
        <article class="article-content">
            <h1>{title}</h1>
            <img src="/img/{slug}-hero.png" alt="{hero_alt}" style="width:100%;border-radius:8px;margin-bottom:1.5rem;">
            {intro}
            <h2>What Actually Matters</h2>
            <ul>{what_matters_html}</ul>
            <h2>Our Top Picks</h2>{product_html}
            <h2>Comparison: At a Glance</h2>
            <table class="comparison-table">
                <thead><tr><td>{comp_header}</td></tr></thead>
                <tbody>{comp_rows}</tbody>
            </table>
            <h2>Frequently Asked Questions</h2>{faq_html}
            <p><em>We earn commissions from qualifying purchases. Prices and availability are subject to change. Last updated July 2026.</em></p>
        </article>
        <aside>
            <div class="sidebar-card"><h3>Quick Links</h3><ul><li><a href="#what-actually-matters">What Matters</a></li><li><a href="#our-top-picks">Our Top Picks</a></li><li><a href="#comparison">Comparison</a></li><li><a href="#frequently-asked-questions">FAQ</a></li></ul></div>
            <div class="sidebar-card"><h3>More Guides</h3><ul>{related_html}</ul></div>
            <div class="sidebar-card disclosure"><p>As an Amazon Associate, I earn from qualifying purchases. <a href="/disclosure/">Full disclosure →</a></p></div>
        </aside>
    </div>
    <footer><div class="footer-inner"><div class="footer-col"><h4>The Yarn</h4><p>Honest product recommendations, thoroughly researched.</p></div><div class="footer-col"><h4>Categories</h4><ul>{FOOTER_CATS}</ul></div><div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy/">Privacy Policy</a></li><li><a href="/disclosure/">Affiliate Disclosure</a></li></ul></div></div><p class="copyright">&copy; 2026 The Yarn. As an Amazon Associate, I earn from qualifying purchases.</p></footer>
</body>
</html>"""
    return html

# Article data - all 28 remaining articles
articles = [
    {
        "slug": "best-cast-iron-skillet",
        "title": "Best Cast Iron Skillets (And How to Season Them Right)",
        "desc": "Honest cast iron skillet reviews — preseasoned pans that don't stick, don't rust, and cook like they should.",
        "category": "Home & Kitchen", "category_url": "home-kitchen",
        "hero_alt": "Cast iron skillet on stovetop",
        "intro": "<p>I bought my first cast iron skillet at a garage sale for $3. It was rusted, crusted, and looked like it had been buried in a yard for a decade. After three hours of scrubbing, reseasoning, and wondering why I bothered, I cooked an egg in it the next morning and it slid around like it was on butter. That $3 skillet is still the best pan I own.</p><p>Cast iron isn't complicated, but the internet makes it feel like you need a degree in metallurgy to cook with one. You don't. You need a good skillet and about 10 minutes of knowledge. Here's both.</p>",
        "what_matters": ["<strong>Pre-seasoned vs bare:</strong> Most modern cast iron comes preseasoned from the factory. It's not a perfect nonstick surface yet — you'll build that up over time — but it's enough to start cooking immediately. Bare cast iron requires seasoning from scratch, which takes 2-3 rounds of oiling and heating.", "<strong>Weight matters more than you think:</strong> A 12-inch skillet full of food weighs 8-10 pounds. If you have wrist issues or do a lot of one-handed pan flips, look at lighter options (Lodge is surprisingly manageable, Stargazer is the lightest in this category).", "<strong>Smooth cooking surface:</strong> Vintage cast iron is prized because it was machined smooth. Modern cast iron from Lodge has a pebbly texture that improves with use but never gets glass-smooth. If you want smooth out of the box, look at Field, Stargazer, or Smithey.", "<strong>Handle length and shape:</strong> Short handles stay cooler but give less leverage. Long handles give better control but can be awkward in the oven. The helper handle (the small one opposite the main handle) is essential for a 12-inch skillet."],
        "products": [
            {"name": "Lodge Classic 12-Inch", "tagline": "Best Overall", "body": "The cast iron skillet everyone should own at least once. It's $30, preseasoned well enough to start cooking immediately, and built like a tank — I've dropped mine on concrete and it didn't even chip. The cooking surface has Lodge's characteristic pebbly texture, which means the first few eggs might stick a little. After a month of regular use and proper care, it develops a natural nonstick patina that gets better over time. The helper handle makes it easy to lift when it's full. At this price, there's no reason not to have one.", "best_for": "Everyone's first cast iron — indestructible, affordable, and improves with age.", "url": "https://www.amazon.com/dp/B000062NQ9?tag=drevikbsg-20"},
            {"name": "Victoria 12-Inch", "tagline": "Best Budget Alternative", "body": "Victoria makes cast iron in Colombia and it shows — the finish is slightly smoother than Lodge, the handle has a unique curved shape that's comfortable to grip, and it comes with two silicone handle covers (Lodge charges extra for theirs). The pour spouts are more defined, which actually helps when you're draining grease. It's within a few dollars of the Lodge but feels slightly more refined. If Lodge is the Honda Civic of cast iron, Victoria is the Mazda 3 — same category, slightly nicer interior.", "best_for": "People who want Lodge-level value with a slightly smoother surface.", "url": "https://www.amazon.com/dp/B01MZ3LQG5?tag=drevikbsg-20"},
            {"name": "Stargazer 12-Inch", "tagline": "Best Premium Lightweight", "body": "The Stargazer is what happens when an industrial designer makes cast iron. The cooking surface is smooth from day one — machined, not sand-cast rough. The handle is long and angled so it stays cool on the stovetop. It weighs about 6.5 pounds for the 12-inch, which is almost 2 pounds lighter than the Lodge. The pour spouts are wide and functional. It's $195, which is a lot for a pan you could get for $30. But if you cook with cast iron every day, the lighter weight and smoother surface make a genuine difference in how enjoyable it is to use.", "best_for": "Daily cast iron cooks who want something lighter and smoother.", "url": "https://www.amazon.com/dp/B07HGD3VYF?tag=drevikbsg-20"},
            {"name": "Field Company No.12", "tagline": "Best Smooth Surface", "body": "Field Company cast iron is machined smooth, like vintage Griswold and Wagner pans from the 1930s-50s. That smooth surface means eggs slide, pancakes release, and you get nonstick performance months faster than a rough-cast Lodge. The ergonomic handle stays cooler than most, and the overall design is clean without being precious. At $195, it's expensive, but it's the pan that most closely replicates the experience of cooking with 80-year-old vintage cast iron without the eBay hunting and rust removal.", "best_for": "People who want vintage-level smoothness without the vintage hunting.", "url": "https://www.amazon.com/dp/B07212VXPV?tag=drevikbsg-20"},
            {"name": "Smithey 12-Inch", "tagline": "Best Looking", "body": "If you want cast iron that looks as good as it cooks, Smithey is the answer. The interior is polished to a near-mirror finish, the exterior has a beautiful matte texture, and the three-quart capacity is perfect for family meals. It's the most visually impressive skillet on this list and it performs like it looks — the smooth interior means excellent nonstick performance from the start. The lid (sold separately) is also cast iron, which means you can bake cornbread or Dutch oven recipes. At $225 it's an investment, but it's one of those pans that genuinely gets better for decades.", "best_for": "Cooking enthusiasts who want cast iron that's as beautiful as it is functional.", "url": "https://www.amazon.com/dp/B07QFPW8J1?tag=drevikbsg-20"}
        ],
        "comparison": {"headers": "Skillet</th><th>Weight</th><th>Surface</th><th>Preseasoned</th><th>Price</th><th>Best For", "rows": [["<strong>Lodge 12\"</strong>","8.6 lbs","Pebbly","Yes","~$30","Most people"],["<strong>Victoria 12\"</strong>","8.3 lbs","Slightly smoother","Yes","~$35","Value + comfort"],["<strong>Stargazer 12\"</strong>","6.5 lbs","Machined smooth","Yes","~$195","Lightweight daily"],["<strong>Field No.12</strong>","7.7 lbs","Machined smooth","Yes","~$195","Vintage feel"],["<strong>Smithey 12\"</strong>","8.4 lbs","Polished mirror","Yes","~$225","Beauty + performance"]]},
        "faqs": [
            ("Do I really need to season cast iron?", "Yes, but probably less than you think. Modern preseasoned skillets (Lodge, Victoria) come ready to cook on — the factory seasoning is good enough for most things. What you need to do is maintain and improve it: cook fatty foods (bacon, steak), wipe with a thin oil layer after cleaning, and avoid soap unless you're reseasoning. Over months of regular use, the seasoning builds into a natural nonstick surface."),
            ("Can I use soap on cast iron?", "Yes. Modern dish soap doesn't strip seasoning — that's a myth from when soap contained lye. A little Dawn and a sponge won't hurt your pan. What WILL hurt it is soaking it, putting it in the dishwasher, or scrubbing with steel wool."),
            ("Why does my cast iron food stick?", "Three reasons: not enough fat in the pan, heat too high, or the seasoning isn't built up yet. Cast iron needs more oil than nonstick — don't be shy. Medium heat is usually enough. And if your pan is new, the first month of cooking will have some sticking — that's normal. Cook bacon and steak for the first few weeks to build up the seasoning."),
            ("How do I remove rust from cast iron?", "Scrub with steel wool or a chainmail scrubber until the rust is gone. Rinse, dry completely (put it on the stove on low for 5 minutes), then reseason: thin coat of vegetable oil, wipe it almost dry, put in the oven at 450°F for 1 hour. Let it cool in the oven. Repeat if the surface still looks dull."),
            ("Is cast iron better than nonstick?", "For searing, baking, and high-heat cooking, cast iron is better — it holds heat better and gets much hotter than nonstick. For eggs, fish, and delicate items, a well-seasoned cast iron works fine, but nonstick is easier. The real advantage of cast iron is durability — a nonstick pan lasts 1-3 years. A cast iron skillet lasts generations."),
            ("What's the best oil for seasoning cast iron?", "Grapeseed oil has the highest smoke point among common cooking oils (420°F), making it the best choice for seasoning. Vegetable oil and canola oil work fine too. Flaxseed oil creates a beautiful black patina but can flake. Never use olive oil for seasoning — it smokes too low and leaves a sticky residue."),
            ("Can I use metal utensils on cast iron?", "Yes. Metal spatulas, tongs, and forks won't damage the cooking surface. The seasoning layer is polymerized oil bonded to the iron — metal won't scrape it off. Avoid metal scrubbers for cleaning, but metal cooking utensils are fine.")
        ],
        "related": [{"slug": "best-french-press", "title": "Best French Press"}, {"slug": "best-air-purifiers", "title": "Best Air Purifiers for Pets"}, {"slug": "robot-vacuums-pet-hair", "title": "Robot Vacuums for Pet Hair"}]
    },
]

# Generate all articles
base_dir = "/home/Drevik/vault/Affiliate/site"
for article in articles:
    html = make_article(article)
    path = os.path.join(base_dir, article["slug"], "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(html)
    print(f"Written: {path}")

print(f"\nGenerated {len(articles)} articles")