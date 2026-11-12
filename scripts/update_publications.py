"""
Adds Corinna Schindler's new papers to data/publications.js, using OpenAlex
(a free, open database of scholarly papers: https://openalex.org).

Runs automatically every week from GitHub (see .github/workflows/publications.yml).
You can also run it yourself:  python scripts/update_publications.py

What it does
  1. Finds Corinna's author record(s) in OpenAlex.
  2. Downloads her papers published since START_YEAR.
  3. Skips anything already on the site (same DOI or same title).
  4. Guesses a research topic for each new paper from keywords in its title,
     and marks it "needs_review": true so you can check the topic by hand.

Nothing already in data/publications.js is ever changed or deleted.
"""
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

# ---------------------------------------------------------------- settings
AUTHOR_NAME = "Corinna Schindler"
# Optional but more reliable: Corinna's ORCID, e.g. "0000-0000-0000-0000".
ORCID = os.environ.get("SCHINDLER_ORCID", "")
START_YEAR = 2022          # only look for papers from this year onward
API_KEY = os.environ.get("OPENALEX_API_KEY", "")   # set as a GitHub secret
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "publications.js")

TOPICS = {
    "com": "Carbonyl-Olefin Metathesis (COM)",
    "total-synthesis": "Total Synthesis and Natural Products",
    "photochemistry": "Photochemistry and Heterocycles",
    "electrochemistry": "Electrochemistry and Technology Development",
    "desulfurization": "Desulfurization",
    "bc-cancer": "BC Cancer Research",
}

# Keyword rules used to guess topics (case-insensitive). A paper can get several.
TOPIC_KEYWORDS = {
    "com": [r"metathesis", r"carbonyl.olefin", r"superelectrophil", r"lewis acid"],
    "total-synthesis": [r"total synthes", r"natural product", r"synthesis of \(", r"meroterpenoid",
                        r"lingzhiol", r"herquline", r"mycocyclosin", r"cochlearol", r"penaresidin",
                        r"gibberellin", r"banyaside", r"marinomycin", r"microcin", r"kaurene",
                        r"lapachone", r"chiloglottone", r"pharbinilic", r"aeruginosin", r"bioactive"],
    "photochemistry": [r"photo", r"visible.light", r"light.mediated", r"light.enabled", r"patern",
                       r"azetidin", r"azetin", r"oxetane", r"\[2\s*\+\s*2\]", r"energy transfer",
                       r"heterocycl", r"pyrrol", r"pyridine", r"pyran", r"furan"],
    "electrochemistry": [r"electro(?!phil)", r"\bflow\b", r"high.throughput", r"automat"],
    "desulfurization": [r"desulfur", r"\bthiols?\b", r"\bsulfur", r"thioether", r"sulfide"],
    "bc-cancer": [r"cancer", r"tumou?r", r"oncolog", r"nf.?κb", r"nf.?kappa", r"\bikk"],
}


def classify(title):
    t = title.lower()
    return [k for k, pats in TOPIC_KEYWORDS.items() if any(re.search(p, t) for p in pats)]


# ---------------------------------------------------------------- data file
HEADER = """// Schindler Lab publications. This file is read by publications.html.
//
// HOW TO EDIT
//  - To change a paper's research topic, edit its "topics" list. Topic ids:
//      com, total-synthesis, photochemistry, electrochemistry, desulfurization, bc-cancer
//    A paper can have several topics, e.g. "topics": ["com", "photochemistry"]
//  - "needs_review": true means the topic was guessed automatically. After you
//    check it, change it to false (or delete the line).
//  - New papers are added automatically every week (scripts/update_publications.py).
"""


def load():
    with open(DATA_FILE, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"window\.PUBLICATIONS\s*=\s*(\[.*\])\s*;", text, re.S)
    return json.loads(m.group(1)) if m else []


def save(pubs):
    pubs.sort(key=lambda p: (-int(p.get("year") or 0), p.get("title", "").lower()))
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(HEADER + "window.PUBLICATIONS = ")
        f.write(json.dumps(pubs, ensure_ascii=False, indent=2))
        f.write(";\n")


def norm_title(t):
    t = unicodedata.normalize("NFKD", t or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", t)


def norm_doi(d):
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", (d or "").strip(), flags=re.I).lower()


# ---------------------------------------------------------------- OpenAlex
def api(path, **params):
    if API_KEY:
        params["api_key"] = API_KEY
    url = "https://api.openalex.org/" + path + "?" + urllib.parse.urlencode(params)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # rate limit / temporary errors: wait and retry
            print(f"  request failed ({e}); retrying...")
            time.sleep(2 ** attempt)
    raise SystemExit("OpenAlex could not be reached. Nothing was changed.")


def find_author_ids():
    if ORCID:
        a = api(f"authors/orcid:{ORCID}")
        return [a["id"].rsplit("/", 1)[-1]]
    res = api("authors", search=AUTHOR_NAME, per_page=25)["results"]
    ids = []
    for a in res:
        name = a.get("display_name", "")
        # "Corinna Schindler", "Corinna S. Schindler", "C. S. Schindler"...
        if re.fullmatch(r"(Corinna|C\.)\s+(S\.?\s+)?Schindler", name.strip(), re.I):
            ids.append(a["id"].rsplit("/", 1)[-1])
            print(f"  author match: {name} ({a['id']}, {a.get('works_count')} works)")
    return ids


def fetch_works(author_ids):
    works, cursor = [], "*"
    flt = f"author.id:{'|'.join(author_ids)},from_publication_date:{START_YEAR}-01-01"
    while cursor:
        page = api("works", filter=flt, per_page=100, cursor=cursor)
        works += page["results"]
        cursor = page["meta"].get("next_cursor")
        if not page["results"]:
            break
    return works


def to_entry(w):
    names = [a["author"]["display_name"] for a in w.get("authorships", [])]
    authors = ", ".join(names[:-1]) + (", and " if len(names) > 2 else " and ") + names[-1] if len(names) > 1 else "".join(names)
    src = ((w.get("primary_location") or {}).get("source") or {})
    bib = w.get("biblio") or {}
    pages = "–".join(x for x in [bib.get("first_page"), bib.get("last_page")] if x)
    title = re.sub(r"<[^>]+>", "", w.get("display_name") or w.get("title") or "").strip()
    return {
        "title": title,
        "authors": authors,
        "journal": src.get("display_name") or "",
        "year": w.get("publication_year"),
        "volume": bib.get("volume") or "",
        "pages": pages,
        "doi": norm_doi(w.get("doi")),
        "topics": classify(title),
        "needs_review": True,
    }


SKIP_TYPES = {"paratext", "erratum", "retraction", "peer-review", "editorial", "letter", "other"}


def main():
    pubs = load()
    have_doi = {norm_doi(p.get("doi")) for p in pubs if p.get("doi")}
    have_title = {norm_title(p.get("title")) for p in pubs}
    print("Finding author in OpenAlex...")
    ids = find_author_ids()
    if not ids:
        raise SystemExit("Author not found. Set SCHINDLER_ORCID to fix this.")
    works = fetch_works(ids)
    print(f"OpenAlex returned {len(works)} papers since {START_YEAR}.")
    added = []
    for w in works:
        if w.get("type") in SKIP_TYPES:
            continue
        e = to_entry(w)
        if not e["title"]:
            continue
        if (e["doi"] and e["doi"] in have_doi) or norm_title(e["title"]) in have_title:
            continue
        pubs.append(e)
        have_doi.add(e["doi"])
        have_title.add(norm_title(e["title"]))
        added.append(e)
    if added:
        save(pubs)
        print(f"\nAdded {len(added)} new paper(s):")
        for e in added:
            t = ", ".join(TOPICS[k] for k in e["topics"]) or "NO TOPIC GUESSED - please set one"
            print(f"  - {e['year']} | {e['title']}\n      topic guess: {t}")
    else:
        print("No new papers.")
    # GitHub Actions job summary
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(f"### Publications update\n\n{len(added)} new paper(s) added.\n\n")
            for e in added:
                t = ", ".join(TOPICS[k] for k in e["topics"]) or "**no topic guessed**"
                f.write(f"- {e['year']} — {e['title']} (topic: {t})\n")


if __name__ == "__main__":
    main()
