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
<<<<<<< HEAD
=======
//  - "hidden": true keeps a paper off the website but stops it from being added
//    again. Preprints are hidden automatically once a newer version or the
//    published paper exists. To show a paper again, delete its "hidden" line.
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
//  - New papers are added automatically every week (scripts/update_publications.py).
"""


def load():
    with open(DATA_FILE, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"window\.PUBLICATIONS\s*=\s*(\[.*\])\s*;", text, re.S)
    if not m:
        # Safety stop: the file isn't the list of papers (e.g. a file was put in the
        # wrong folder). Stop instead of starting a new, nearly empty list.
        raise SystemExit("data/publications.js does not contain the publication list "
                         "(window.PUBLICATIONS = [...]). Nothing was changed.")
    return json.loads(m.group(1))


def save(pubs):
<<<<<<< HEAD
    pubs.sort(key=lambda p: (-int(p.get("year") or 0), p.get("title", "").lower()))
=======
    pubs.sort(key=sort_key, reverse=True)
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(HEADER + "window.PUBLICATIONS = ")
        f.write(json.dumps(pubs, ensure_ascii=False, indent=2))
        f.write(";\n")


<<<<<<< HEAD
=======
def sort_key(p):
    """Newest first: by publication date when known, otherwise by the old list number."""
    year = int(p.get("year") or 0)
    date = p.get("date") or ""
    return (year, date[:10] if date.startswith(str(year)) else "", int(p.get("seq") or 0))


>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
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
<<<<<<< HEAD
=======
        "date": w.get("publication_date") or "",
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
        "volume": bib.get("volume") or "",
        "pages": pages,
        "doi": norm_doi(w.get("doi")),
        "topics": classify(title),
        "needs_review": True,
    }


<<<<<<< HEAD
SKIP_TYPES = {"paratext", "erratum", "retraction", "peer-review", "editorial", "letter", "other"}
=======
SKIP_TYPES = {"paratext", "erratum", "retraction", "peer-review", "editorial", "letter", "other",
              "dataset", "supplementary-materials"}
# Records that are not papers (crystal structures, supporting information, ...)
SKIP_TITLES = [r"^ccdc\s*\d+", r"crystal structure determination", r"^csd\s*\d+",
               r"supporting information", r"supplementary (information|data|material)"]
SKIP_SOURCES = [r"cambridge structural database", r"\bccdc\b", r"figshare", r"zenodo"]


def is_not_a_paper(w, title, journal):
    if w.get("type") in SKIP_TYPES:
        return True
    if any(re.search(p, title, re.I) for p in SKIP_TITLES):
        return True
    return any(re.search(p, journal or "", re.I) for p in SKIP_SOURCES)


# ---------------------------------------------------------------- preprints
PREPRINT_RE = r"chemrxiv|arxiv|biorxiv|medrxiv|research square|ssrn|preprint"


def is_preprint(p):
    return bool(re.search(PREPRINT_RE, p.get("journal", ""), re.I)) or (p.get("doi") or "").startswith("10.26434/")


STOP = set("a an the of and for to in on via with by from as at or its their using enable enables enabled".split())


def title_words(t):
    t = re.sub(r"<[^>]+>", "", (t or "").lower())
    return {w for w in re.findall(r"[a-z0-9]+", t) if w not in STOP and len(w) > 1}


def title_similarity(a, b):
    A, B = title_words(a), title_words(b)
    return len(A & B) / max(1, len(A | B))


def crossref_published_doi(doi):
    """ChemRxiv records 'is-preprint-of' in Crossref once a preprint is published."""
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi)
    mailto = os.environ.get("CROSSREF_MAILTO")
    if mailto:
        url += "?mailto=" + urllib.parse.quote(mailto)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SchindlerLabWebsite/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            rel = (json.load(r).get("message") or {}).get("relation") or {}
        for item in rel.get("is-preprint-of", []):
            if item.get("id"):
                return norm_doi(item["id"])
    except Exception as e:
        print(f"  (could not check {doi} on Crossref: {e})")
    return None


def hide(p, reason):
    p["hidden"] = True
    p["hidden_reason"] = reason


def hide_superseded_preprints(pubs, use_crossref=True):
    """Hide preprints that have a newer version or a published paper. Returns what was hidden."""
    newly = []
    visible = lambda p: not p.get("hidden")
    # 1) several versions of the same preprint DOI (…/v1, …/v2): keep only the newest
    groups = {}
    for p in pubs:
        if is_preprint(p) and p.get("doi"):
            base = re.sub(r"/v\d+$", "", p["doi"])
            ver = int((re.search(r"/v(\d+)$", p["doi"]) or [0, 1])[1])
            groups.setdefault(base, []).append((ver, p))
    for versions in groups.values():
        versions.sort(key=lambda x: x[0])
        for ver, p in versions[:-1]:
            if visible(p):
                hide(p, "older version of a preprint")
                newly.append(p)
    # 2) ChemRxiv/Crossref says the preprint was published; 3) near-identical published title
    published = [q for q in pubs if not is_preprint(q)]
    for p in pubs:
        if not (is_preprint(p) and visible(p)):
            continue
        pub_doi = crossref_published_doi(p["doi"]) if (use_crossref and p.get("doi")) else None
        if pub_doi:
            hide(p, f"published as {pub_doi}")
            newly.append(p)
            continue
        for q in published:
            if int(q.get("year") or 0) >= int(p.get("year") or 0) and title_similarity(p["title"], q["title"]) >= 0.75:
                hide(p, f"published as {q.get('doi') or q['title']}")
                newly.append(p)
                break
    return newly
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979


def main():
    pubs = load()
<<<<<<< HEAD
    have_doi = {norm_doi(p.get("doi")) for p in pubs if p.get("doi")}
    have_title = {norm_title(p.get("title")) for p in pubs}
=======
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
    print("Finding author in OpenAlex...")
    ids = find_author_ids()
    if not ids:
        raise SystemExit("Author not found. Set SCHINDLER_ORCID to fix this.")
    works = fetch_works(ids)
    print(f"OpenAlex returned {len(works)} papers since {START_YEAR}.")
<<<<<<< HEAD
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
=======
    by_doi = {norm_doi(p.get("doi")): p for p in pubs if p.get("doi")}
    by_title = {norm_title(p.get("title")): p for p in pubs}
    added, dated = [], 0
    for w in works:
        e = to_entry(w)
        if not e["title"] or is_not_a_paper(w, e["title"], e["journal"]):
            continue
        existing = by_doi.get(e["doi"]) if e["doi"] else None
        existing = existing or by_title.get(norm_title(e["title"]))
        if existing:
            # same preprint, newer version (…/v2 -> …/v3): point the link at the newest version
            ex_doi, new_doi = existing.get("doi") or "", e["doi"]
            if (new_doi and ex_doi != new_doi and is_preprint(existing)
                    and re.sub(r"/v\d+$", "", ex_doi) == re.sub(r"/v\d+$", "", new_doi)):
                ver = lambda d: int((re.search(r"/v(\d+)$", d) or [0, 1])[1])
                if ver(new_doi) > ver(ex_doi):
                    existing["doi"], existing["date"] = new_doi, e["date"] or existing.get("date", "")
                    by_doi[new_doi] = existing
                    dated += 1
                continue
            if not existing.get("date") and e["date"]:
                existing["date"] = e["date"]      # only fills in the date, nothing else
                dated += 1
            continue
        pubs.append(e)
        if e["doi"]:
            by_doi[e["doi"]] = e
        by_title[norm_title(e["title"])] = e
        added.append(e)
    hidden = hide_superseded_preprints(pubs)
    if added or dated or hidden:
        save(pubs)
    for p in hidden:
        print(f"Hid preprint: {p['title']} ({p['hidden_reason']})")
    if dated:
        print(f"Filled in publication dates for {dated} paper(s) already on the site.")
    if added:
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
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
<<<<<<< HEAD
            f.write(f"### Publications update\n\n{len(added)} new paper(s) added.\n\n")
=======
            f.write(f"### Publications update\n\n{len(added)} new paper(s) added, "
                    f"{len(hidden)} preprint(s) hidden because a newer or published version exists.\n\n")
            for p in hidden:
                f.write(f"- Hidden: {p['title']} ({p['hidden_reason']})\n")
>>>>>>> ed66dea1f93852fd793a029e45583ca700dbb979
            for e in added:
                t = ", ".join(TOPICS[k] for k in e["topics"]) or "**no topic guessed**"
                f.write(f"- {e['year']} — {e['title']} (topic: {t})\n")


if __name__ == "__main__":
    main()
