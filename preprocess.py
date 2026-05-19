"""
preprocess.py
-------------
Run once locally to convert gender_progress_checkpoint.csv into
the lightweight data files the website needs.

Usage:
    pip install pandas tqdm
    python preprocess.py --input gender_progress_checkpoint.csv --output ./data

Outputs (all written to --output directory):
    summary.json      ~50KB   Overview stats, uni breakdowns, field breakdowns, combo counts
    by_year.json      ~20KB   Per-year data for all trend charts
    percentiles.json  ~30KB   Citation percentile rankings within each year cohort
    papers.db                 SQLite database for search/browse (expect ~80–150MB)
"""

import argparse
import json
import os
import sqlite3

import pandas as pd
from tqdm import tqdm


# ---------------------------------------------------------------------------
# Journal → broad field mapping
# ---------------------------------------------------------------------------
# Rules are checked in order — first match wins.
# Each entry is (substring_to_find_in_lowercased_journal_name, broad_field).
# Edit freely to improve coverage; unmapped journals fall through to "Other".
#
# IMPORTANT: be careful with short substrings — they can match unintended
# journals. Prefer specific substrings over short ones (e.g. "cell biology"
# not "cell", "legal studi" not "law").

FIELD_RULES = [
    # Medicine & Health
    ("medicine", "Medicine & Health"),
    ("medical", "Medicine & Health"),
    ("health", "Medicine & Health"),
    ("clinical", "Medicine & Health"),
    ("surgery", "Medicine & Health"),
    ("surgical", "Medicine & Health"),
    ("oncol", "Medicine & Health"),
    ("cancer", "Medicine & Health"),
    ("cardiol", "Medicine & Health"),
    ("pediatr", "Medicine & Health"),
    ("paediatr", "Medicine & Health"),
    ("psychiatr", "Medicine & Health"),
    ("neurol", "Medicine & Health"),
    ("pharmacol", "Medicine & Health"),
    ("pharmac", "Medicine & Health"),
    ("epidemiol", "Medicine & Health"),
    ("public health", "Medicine & Health"),
    ("nursing", "Medicine & Health"),
    ("obstetric", "Medicine & Health"),
    ("gynecol", "Medicine & Health"),
    ("gynaecol", "Medicine & Health"),
    ("radiol", "Medicine & Health"),
    ("pathol", "Medicine & Health"),
    ("immunol", "Medicine & Health"),
    ("infect", "Medicine & Health"),
    ("virol", "Medicine & Health"),
    ("respirat", "Medicine & Health"),
    ("dental", "Medicine & Health"),
    ("ophthalmol", "Medicine & Health"),
    ("dermatol", "Medicine & Health"),
    ("rheumatol", "Medicine & Health"),
    ("anaesthes", "Medicine & Health"),
    ("anesthes", "Medicine & Health"),
    ("palliative", "Medicine & Health"),
    ("rehabilitation", "Medicine & Health"),

    # Biology & Life Sciences
    # "cell biology" before bare "cell" to avoid false matches on e.g. "fuel cell"
    ("cell biology", "Biology & Life Sciences"),
    ("biology", "Biology & Life Sciences"),
    ("biological", "Biology & Life Sciences"),
    ("biochem", "Biology & Life Sciences"),
    ("molecular", "Biology & Life Sciences"),
    ("genet", "Biology & Life Sciences"),
    ("genomic", "Biology & Life Sciences"),
    ("proteom", "Biology & Life Sciences"),
    ("microbi", "Biology & Life Sciences"),
    ("ecolog", "Biology & Life Sciences"),
    ("evolution", "Biology & Life Sciences"),
    ("zoolog", "Biology & Life Sciences"),
    ("botany", "Biology & Life Sciences"),
    ("plant science", "Biology & Life Sciences"),
    ("marine biol", "Biology & Life Sciences"),
    ("biophysic", "Biology & Life Sciences"),
    ("physiol", "Biology & Life Sciences"),
    ("neuroscien", "Biology & Life Sciences"),
    ("plos", "Biology & Life Sciences"),
    ("nature comm", "Biology & Life Sciences"),
    ("stem cell", "Biology & Life Sciences"),
    ("developmental biol", "Biology & Life Sciences"),

    # Physical Sciences & Engineering
    ("physics", "Physical Sciences & Engineering"),
    ("physical review", "Physical Sciences & Engineering"),
    ("chemistry", "Physical Sciences & Engineering"),
    ("chemical engineer", "Physical Sciences & Engineering"),
    ("chemical", "Physical Sciences & Engineering"),
    ("engineering", "Physical Sciences & Engineering"),
    ("materials science", "Physical Sciences & Engineering"),
    ("materials", "Physical Sciences & Engineering"),
    ("polymer", "Physical Sciences & Engineering"),
    ("nanotechnol", "Physical Sciences & Engineering"),
    ("optic", "Physical Sciences & Engineering"),
    ("photon", "Physical Sciences & Engineering"),
    ("catalysis", "Physical Sciences & Engineering"),
    ("electroch", "Physical Sciences & Engineering"),
    ("thermal", "Physical Sciences & Engineering"),
    ("mechanic", "Physical Sciences & Engineering"),
    ("manufact", "Physical Sciences & Engineering"),
    ("geotechn", "Physical Sciences & Engineering"),
    ("aerospace", "Physical Sciences & Engineering"),
    ("metallurg", "Physical Sciences & Engineering"),
    ("tribolog", "Physical Sciences & Engineering"),

    # Computer Science & Mathematics
    ("computer", "Computer Science & Mathematics"),
    ("computing", "Computer Science & Mathematics"),
    ("software", "Computer Science & Mathematics"),
    ("algorithm", "Computer Science & Mathematics"),
    ("artificial intelligen", "Computer Science & Mathematics"),
    ("machine learn", "Computer Science & Mathematics"),
    ("data mining", "Computer Science & Mathematics"),
    ("information system", "Computer Science & Mathematics"),
    ("information science", "Computer Science & Mathematics"),
    ("cybersecur", "Computer Science & Mathematics"),
    ("mathemat", "Computer Science & Mathematics"),
    ("statistic", "Computer Science & Mathematics"),
    ("operations research", "Computer Science & Mathematics"),
    ("neural network", "Computer Science & Mathematics"),
    ("pattern recognit", "Computer Science & Mathematics"),
    # "network" intentionally omitted — too ambiguous (matches social networks,
    # computer networks, neural networks, etc. across multiple fields)

    # Social Sciences & Economics
    # More specific phrases before bare "social" to avoid false matches
    ("social network", "Social Sciences & Economics"),
    ("social science", "Social Sciences & Economics"),
    ("social work", "Social Sciences & Economics"),
    ("social", "Social Sciences & Economics"),
    ("sociology", "Social Sciences & Economics"),
    ("economic", "Social Sciences & Economics"),
    ("finance", "Social Sciences & Economics"),
    ("financial", "Social Sciences & Economics"),
    ("accounting", "Social Sciences & Economics"),
    ("management", "Social Sciences & Economics"),
    ("business", "Social Sciences & Economics"),
    ("marketing", "Social Sciences & Economics"),
    ("political", "Social Sciences & Economics"),
    ("policy", "Social Sciences & Economics"),
    ("legal studi", "Social Sciences & Economics"),
    ("law review", "Social Sciences & Economics"),
    ("journal of law", "Social Sciences & Economics"),
    ("criminol", "Social Sciences & Economics"),
    ("psycholog", "Social Sciences & Economics"),
    ("education", "Social Sciences & Economics"),
    ("pedagog", "Social Sciences & Economics"),
    ("anthropolog", "Social Sciences & Economics"),
    ("demograph", "Social Sciences & Economics"),
    ("urban studi", "Social Sciences & Economics"),
    ("geograph", "Social Sciences & Economics"),
    ("public administration", "Social Sciences & Economics"),
    ("international relation", "Social Sciences & Economics"),

    # Environmental Sciences
    ("environment", "Environmental Sciences"),
    ("climate", "Environmental Sciences"),
    ("atmospheric", "Environmental Sciences"),
    ("oceanograph", "Environmental Sciences"),
    ("marine science", "Environmental Sciences"),
    ("water resource", "Environmental Sciences"),
    ("hydrol", "Environmental Sciences"),
    ("soil science", "Environmental Sciences"),
    ("sustainab", "Environmental Sciences"),
    ("renewable energy", "Environmental Sciences"),
    ("conservation", "Environmental Sciences"),
    ("biodiversity", "Environmental Sciences"),
    ("forestry", "Environmental Sciences"),
    ("agriculture", "Environmental Sciences"),
    ("agronomy", "Environmental Sciences"),
    ("veterinary", "Environmental Sciences"),
    ("ecology and evolution", "Environmental Sciences"),
    ("global change", "Environmental Sciences"),
    ("earth science", "Environmental Sciences"),
    ("geoscien", "Environmental Sciences"),

    # Humanities & Arts
    ("humanities", "Humanities & Arts"),
    ("history", "Humanities & Arts"),
    ("philosophy", "Humanities & Arts"),
    ("literature", "Humanities & Arts"),
    ("linguistic", "Humanities & Arts"),
    ("applied language", "Humanities & Arts"),
    ("language teaching", "Humanities & Arts"),
    ("communication studies", "Humanities & Arts"),
    ("journalism", "Humanities & Arts"),
    ("cultural studi", "Humanities & Arts"),
    ("cultural", "Humanities & Arts"),
    ("religion", "Humanities & Arts"),
    ("bioethic", "Humanities & Arts"),
    ("gender studi", "Humanities & Arts"),
    ("sport science", "Humanities & Arts"),
    ("tourism", "Humanities & Arts"),
    ("archaeology", "Humanities & Arts"),
    ("museum", "Humanities & Arts"),
]


def map_field(journal: str) -> str:
    """Map a journal name to a broad field using ordered substring rules."""
    if not isinstance(journal, str) or not journal.strip():
        return "Other"
    j = journal.lower()
    for keyword, field in FIELD_RULES:
        if keyword in j:
            return field
    return "Other"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def safe_pct(num, denom) -> float:
    """Return percentage rounded to 2dp, or 0.0 if denominator is zero."""
    return round(float(num) / denom * 100, 2) if denom else 0.0


def gender_counts(series: pd.Series) -> dict:
    """
    Count gender values in a series already normalised to lowercase strings
    (empty string for missing / single-author rows).
    """
    vc = series.value_counts()
    return {
        "female":    int(vc.get("female",    0)),
        "male":      int(vc.get("male",      0)),
        "ambiguous": int(vc.get("ambiguous", 0)),
        "empty":     int(vc.get("",          0)),
    }


# ---------------------------------------------------------------------------
# Vectorised combo computation — avoids slow row-wise apply() on 1M rows
# ---------------------------------------------------------------------------

def compute_combos(df: pd.DataFrame) -> pd.Series:
    """
    Derive authorship combo label for every row using vectorised boolean masks.

    Categories:
        single    — author_count <= 1
        ff        — female first + female last
        mm        — male first + male last
        fm        — female first + male last  (most common "mixed" sub-type)
        mf        — male first + female last
        ambiguous — either position is ambiguous (and not single-author)
        unknown   — multi-author but gender info missing for one/both positions
    """
    fa = df["first_author_gender"]
    la = df["last_author_gender"]
    n  = df["author_count"]

    is_single = n <= 1
    is_ambig  = (~is_single) & ((fa == "ambiguous") | (la == "ambiguous"))
    is_ff     = (~is_single) & (~is_ambig) & (fa == "female") & (la == "female")
    is_mm     = (~is_single) & (~is_ambig) & (fa == "male")   & (la == "male")
    is_fm     = (~is_single) & (~is_ambig) & (fa == "female") & (la == "male")
    is_mf     = (~is_single) & (~is_ambig) & (fa == "male")   & (la == "female")

    combo = pd.Series("unknown", index=df.index, dtype=str)
    combo[is_single] = "single"
    combo[is_ambig]  = "ambiguous"
    combo[is_ff]     = "ff"
    combo[is_mm]     = "mm"
    combo[is_fm]     = "fm"
    combo[is_mf]     = "mf"
    return combo


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(input_path: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    db_path = os.path.join(output_dir, "papers.db")

    # -----------------------------------------------------------------------
    # Load & clean
    # -----------------------------------------------------------------------
    print(f"Reading {input_path} ...")
    df = pd.read_csv(input_path, dtype=str, low_memory=False)

    # Normalise column names
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    # Coerce numeric columns
    df["year"]           = pd.to_numeric(df["year"],           errors="coerce")
    df["cited_by_count"] = pd.to_numeric(df["cited_by_count"], errors="coerce").fillna(0).astype(int)
    df["author_count"]   = pd.to_numeric(df["author_count"],   errors="coerce").fillna(1).astype(int)

    # Normalise gender strings: lowercase, empty string for NaN
    for col in ["first_author_gender", "last_author_gender"]:
        df[col] = df[col].fillna("").str.strip().str.lower()

    # Drop rows with unparseable year, then restrict to study range
    df = df.dropna(subset=["year"])
    df = df[df["year"].between(2005, 2025)].copy()
    df["year"] = df["year"].astype(int)

    print(f"  {len(df):,} papers in range 2005–2025")

    # -----------------------------------------------------------------------
    # Derived columns
    # -----------------------------------------------------------------------
    print("Mapping journals to broad fields ...")
    df["field"] = df["journal"].apply(map_field)

    print("Computing authorship combos ...")
    df["combo"] = compute_combos(df)

    # Citation percentile within each year cohort.
    # method="min" means tied papers share the lowest rank (conservative).
    print("Computing citation percentiles ...")
    df["cite_pct"] = (
        df.groupby("year")["cited_by_count"]
        .rank(method="min", pct=True) * 100
    ).round(2)

    # -----------------------------------------------------------------------
    # 1. summary.json
    # -----------------------------------------------------------------------
    print("Building summary.json ...")

    total = len(df)
    multi = df[df["author_count"] > 1]

    first_gc = gender_counts(df["first_author_gender"])
    last_gc  = gender_counts(multi["last_author_gender"])

    uni_stats = []
    for uni, grp in df.groupby("institution"):
        m = grp[grp["author_count"] > 1]
        uni_stats.append({
            "university":       str(uni),
            "total_papers":     len(grp),
            "first_author":     gender_counts(grp["first_author_gender"]),
            "last_author":      gender_counts(m["last_author_gender"]),
            "female_first_pct": safe_pct(grp["first_author_gender"].eq("female").sum(), len(grp)),
            "female_last_pct":  safe_pct(m["last_author_gender"].eq("female").sum(), len(m)),
        })
    uni_stats.sort(key=lambda x: x["female_first_pct"], reverse=True)

    field_stats = []
    for field, grp in df.groupby("field"):
        m = grp[grp["author_count"] > 1]
        field_stats.append({
            "field":            str(field),
            "total_papers":     len(grp),
            "female_first_pct": safe_pct(grp["first_author_gender"].eq("female").sum(), len(grp)),
            "female_last_pct":  safe_pct(m["last_author_gender"].eq("female").sum(), len(m)),
            "first_author":     gender_counts(grp["first_author_gender"]),
            "last_author":      gender_counts(m["last_author_gender"]),
        })
    field_stats.sort(key=lambda x: x["female_first_pct"], reverse=True)

    combo_totals = {k: int(v) for k, v in df["combo"].value_counts().items()}

    summary = {
        "total_papers": total,
        "year_range":   [int(df["year"].min()), int(df["year"].max())],
        "universities": sorted(df["institution"].dropna().unique().tolist()),
        "fields":       sorted(df["field"].unique().tolist()),
        "overall": {
            "first_author": first_gc,
            "last_author":  last_gc,
        },
        "by_university": uni_stats,
        "by_field":      field_stats,
        "combo_totals":  combo_totals,
    }

    with open(os.path.join(output_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print("  → summary.json written")

    # -----------------------------------------------------------------------
    # 2. by_year.json
    # -----------------------------------------------------------------------
    print("Building by_year.json ...")

    by_year = []
    for year, grp in df.groupby("year"):
        multi_yr = grp[grp["author_count"] > 1]
        single   = grp[grp["author_count"] == 1]

        abs_counts = {
            "female":    int(grp["first_author_gender"].eq("female").sum()),
            "male":      int(grp["first_author_gender"].eq("male").sum()),
            "ambiguous": int(grp["first_author_gender"].eq("ambiguous").sum()),
            "single":    int(len(single)),
        }

        pipeline = {
            "female_first_pct": safe_pct(grp["first_author_gender"].eq("female").sum(), len(grp)),
            "female_last_pct":  safe_pct(multi_yr["last_author_gender"].eq("female").sum(), len(multi_yr)),
            "male_first_pct":   safe_pct(grp["first_author_gender"].eq("male").sum(), len(grp)),
            "male_last_pct":    safe_pct(multi_yr["last_author_gender"].eq("male").sum(), len(multi_yr)),
        }

        combos = {k: int(v) for k, v in grp["combo"].value_counts().items()}

        single_gender = {
            "female":    int(single["first_author_gender"].eq("female").sum()),
            "male":      int(single["first_author_gender"].eq("male").sum()),
            "ambiguous": int(single["first_author_gender"].eq("ambiguous").sum()),
        }

        uni_yr = {
            str(uni): safe_pct(ugrp["first_author_gender"].eq("female").sum(), len(ugrp))
            for uni, ugrp in grp.groupby("institution")
        }

        by_year.append({
            "year":            int(year),
            "total":           len(grp),
            "absolute_counts": abs_counts,
            "pipeline":        pipeline,
            "combos":          combos,
            "single_author":   single_gender,
            "by_university":   uni_yr,
        })

    by_year.sort(key=lambda x: x["year"])

    with open(os.path.join(output_dir, "by_year.json"), "w") as f:
        json.dump(by_year, f, indent=2)
    print("  → by_year.json written")

    # -----------------------------------------------------------------------
    # 3. percentiles.json
    # -----------------------------------------------------------------------
    print("Building percentiles.json ...")

    pct_rows = []
    for year, grp in df.groupby("year"):
        multi_yr = grp[grp["author_count"] > 1]

        for gender in ["female", "male", "ambiguous"]:
            # First-author position (all papers)
            sub = grp[grp["first_author_gender"] == gender]
            if len(sub) > 0:
                pct_rows.append({
                    "year":       int(year),
                    "gender":     gender,
                    "position":   "first",
                    "median_pct": round(float(sub["cite_pct"].median()), 2),
                    "mean_pct":   round(float(sub["cite_pct"].mean()),   2),
                    "n":          len(sub),
                    "top10_pct":  safe_pct((sub["cite_pct"] >= 90).sum(), len(sub)),
                    "top25_pct":  safe_pct((sub["cite_pct"] >= 75).sum(), len(sub)),
                })

            # Last-author position (multi-author papers only)
            sub_l = multi_yr[multi_yr["last_author_gender"] == gender]
            if len(sub_l) > 0:
                pct_rows.append({
                    "year":       int(year),
                    "gender":     gender,
                    "position":   "last",
                    "median_pct": round(float(sub_l["cite_pct"].median()), 2),
                    "mean_pct":   round(float(sub_l["cite_pct"].mean()),   2),
                    "n":          len(sub_l),
                    "top10_pct":  safe_pct((sub_l["cite_pct"] >= 90).sum(), len(sub_l)),
                    "top25_pct":  safe_pct((sub_l["cite_pct"] >= 75).sum(), len(sub_l)),
                })

    with open(os.path.join(output_dir, "percentiles.json"), "w") as f:
        json.dump(pct_rows, f, indent=2)
    print("  → percentiles.json written")

    # -----------------------------------------------------------------------
    # 4. papers.db  (SQLite for search/browse)
    # -----------------------------------------------------------------------
    print("Building papers.db ...")

    cols_for_db = [
        "openalex_id", "doi", "title", "year", "journal", "field",
        "cited_by_count", "cite_pct",
        "first_author_name", "first_author_country",
        "last_author_name",  "last_author_country",
        "author_count", "open_access", "institution",
        "first_author_gender", "last_author_gender", "combo",
    ]
    db_df = df[cols_for_db].copy()

    if os.path.exists(db_path):
        os.remove(db_path)

    # Context manager ensures the connection is always cleanly closed,
    # even if the script crashes mid-write.
    with sqlite3.connect(db_path) as conn:
        # Single explicit transaction: dramatically faster than per-chunk commits
        conn.execute("BEGIN")
        chunk_size = 50_000
        n_chunks = (len(db_df) + chunk_size - 1) // chunk_size
        for i in tqdm(range(n_chunks), desc="  Writing SQLite"):
            chunk = db_df.iloc[i * chunk_size : (i + 1) * chunk_size]
            chunk.to_sql("papers", conn, if_exists="append", index=False)
        conn.execute("COMMIT")

        print("  Creating indexes ...")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_year      ON papers(year)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inst      ON papers(institution)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_field     ON papers(field)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_fa_gen    ON papers(first_author_gender)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_la_gen    ON papers(last_author_gender)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_combo     ON papers(combo)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cited     ON papers(cited_by_count)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cite_pct  ON papers(cite_pct)")

        # FTS5 virtual table for proper full-text keyword search on titles.
        # content= makes it a "content table" — no data duplication.
        print("  Building FTS5 search index ...")
        conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS papers_fts
            USING fts5(
                title,
                first_author_name,
                last_author_name,
                content='papers',
                content_rowid='rowid'
            )
        """)
        conn.execute("INSERT INTO papers_fts(papers_fts) VALUES('rebuild')")
        conn.commit()

    print("  → papers.db written")

    # -----------------------------------------------------------------------
    # Done — print file size summary
    # -----------------------------------------------------------------------
    print("\nAll done! Files written to:", output_dir)
    for fname in ["summary.json", "by_year.json", "percentiles.json", "papers.db"]:
        fpath = os.path.join(output_dir, fname)
        if os.path.exists(fpath):
            size_mb = os.path.getsize(fpath) / 1_048_576
            print(f"  {fname:<22} {size_mb:>7.1f} MB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess gender research CSV")
    parser.add_argument(
        "--input",
        default="/Users/jibi/Downloads/Go8/all_8_universities_merged_2005_2025.csv",
        help="Path to the input CSV file",
    )
    parser.add_argument(
        "--output",
        default="./data",
        help="Directory to write output files into",
    )
    args = parser.parse_args()
    main(args.input, args.output)
