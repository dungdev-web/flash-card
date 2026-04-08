// src/app/api/anki-export/route.ts
// Generates a real .apkg file (SQLite + zip) server-side
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

// ── Minimal SQLite builder (no native deps) ───────────────────────────────────
// Anki .apkg is a zip containing collection.anki2 (SQLite) + media file
// We build a minimal valid SQLite manually for Anki compatibility

function writeInt32LE(buf: Buffer, val: number, offset: number) {
  buf.writeInt32LE(val, offset);
}
function writeInt32BE(buf: Buffer, val: number, offset: number) {
  buf.writeInt32BE(val, offset);
}

// Build minimal Anki SQLite db as Buffer
// Uses anki-apkg-export compatible schema
async function buildAnkiDb(
  cards: { front: string; back: string; tags: string }[],
  deckName: string
): Promise<Buffer> {
  // We'll use a different approach: generate SQL and use sql.js via dynamic import
  // If sql.js not available, fallback to TSV
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const initSqlJs = require("sql.js");
    const SQL = await initSqlJs();
    const db  = new SQL.Database();

    const now    = Math.floor(Date.now() / 1000);
    const deckId = Date.now();
    const modelId = deckId - 1;

    const deckJson = JSON.stringify({
      [String(deckId)]: {
        id: deckId, name: deckName, conf: 1, extendRev: 50, usn: 0,
        collapsed: false, newToday: [0, 0], timeToday: [0, 0],
        dyn: 0, extendNew: 10, revToday: [0, 0], lrnToday: [0, 0],
        desc: "", mod: now,
      },
    });

    const modelJson = JSON.stringify({
      [String(modelId)]: {
        id: modelId, name: "Sakura Basic", type: 0, mod: now, usn: 0,
        sortf: 0, did: deckId, tmpls: [{
          name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}<hr>{{Back}}",
          did: null, bqfmt: "", bafmt: "",
        }],
        flds: [{ name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
               { name: "Back",  ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
               { name: "Tags",  ord: 2, sticky: false, rtl: false, font: "Arial", size: 14 }],
        css: ".card { font-family: serif; font-size: 18px; text-align: center; }",
        latexPre: "", latexPost: "", tags: [], vers: [],
      },
    });

    db.run(`CREATE TABLE col (id INTEGER PRIMARY KEY, crt INTEGER, mod INTEGER, scm INTEGER, ver INTEGER, dty INTEGER, usn INTEGER, ls INTEGER, conf TEXT, models TEXT, decks TEXT, dconf TEXT, tags TEXT)`);
    db.run(`INSERT INTO col VALUES (1,?,?,?,11,0,-1,0,'{}',?,?,'{}','{}')`, [now, now, now, modelJson, deckJson]);

    db.run(`CREATE TABLE notes (id INTEGER PRIMARY KEY, guid TEXT, mid INTEGER, mod INTEGER, usn INTEGER, tags TEXT, flds TEXT, sfld TEXT, csum INTEGER, flags INTEGER, data TEXT)`);
    db.run(`CREATE TABLE cards (id INTEGER PRIMARY KEY, nid INTEGER, did INTEGER, ord INTEGER, mod INTEGER, usn INTEGER, type INTEGER, queue INTEGER, due INTEGER, ivl INTEGER, factor INTEGER, reps INTEGER, lapses INTEGER, left INTEGER, odue INTEGER, odid INTEGER, flags INTEGER, data TEXT)`);
    db.run(`CREATE TABLE revlog (id INTEGER PRIMARY KEY, cid INTEGER, usn INTEGER, ease INTEGER, ivl INTEGER, lastIvl INTEGER, factor INTEGER, time INTEGER, type INTEGER)`);
    db.run(`CREATE TABLE graves (usn INTEGER, oid INTEGER, type INTEGER)`);

    cards.forEach((card, i) => {
      const nid  = deckId + i + 1;
      const cid  = nid + 100000;
      const flds = `${card.front}\x1f${card.back}\x1f${card.tags}`;
      const csum = nid % 1000000000;
      db.run(`INSERT INTO notes VALUES (?,?,?,?,0,?,?,?,?,0,'')`,
        [nid, `sakura${nid}`, modelId, now, card.tags, flds, card.front, csum]);
      db.run(`INSERT INTO cards VALUES (?,?,?,0,?,0,0,0,?,0,2500,0,0,0,0,0,0,'')`,
        [cid, nid, deckId, now, i]);
    });

    const data = db.export();
    db.close();
    return Buffer.from(data);
  } catch {
    // sql.js not available — return null to signal fallback
    return Buffer.alloc(0);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { words, deckName = "Sakura Flashcards" } = await req.json();

    if (!words?.length) {
      return NextResponse.json({ error: "No words" }, { status: 400 });
    }

    const cards = words.map((w: any) => ({
      front: w.phonetic ? `${w.english}\n[${w.phonetic}]` : w.english,
      back:  [w.meaning, w.example].filter(Boolean).join("\n"),
      tags:  w.topic?.toLowerCase().replace(/\s+/g, "_") ?? "",
    }));

    const sqliteDb = await buildAnkiDb(cards, deckName);

    if (sqliteDb.length === 0) {
      // Fallback: return TSV if sql.js unavailable
      const tsv = cards.map((c: any) => `${c.front}\t${c.back}\t${c.tags}`).join("\n");
      return new NextResponse(tsv, {
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          "Content-Disposition": `attachment; filename="sakura_anki.txt"`,
        },
      });
    }

    // Build .apkg (zip)
    const zip = new JSZip();
    zip.file("collection.anki2", sqliteDb);
    zip.file("media", "{}"); // no media

    const apkg = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(apkg, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="sakura_anki.apkg"`,
      },
    });
  } catch (err) {
    console.error("[Anki Export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}