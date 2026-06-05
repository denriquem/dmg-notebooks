#!/usr/bin/env python3
"""
Seed script for DMNotebook.
Creates a demo user, 3 pages (different dates), and realistic blocks including
a React/TypeScript code block suitable for testing the AI explain/refactor endpoints.

Usage:
    python3 scripts/seed.py
    python3 scripts/seed.py --base http://localhost:3001
"""

import argparse
import http.cookiejar
import json
import sys
import urllib.request

NOTE_LIST_COMPONENT = """\
import React from "react";

interface NoteItem {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  tags: string[];
}

interface NoteCardProps {
  note: NoteItem;
  onSelect: (id: string) => void;
}

function NoteCard({ note, onSelect }: NoteCardProps) {
  return (
    <li
      onClick={() => onSelect(note.id)}
      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
        <span className="text-xs text-gray-400 whitespace-nowrap">{note.updatedAt}</span>
      </div>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{note.preview}</p>
      {note.tags.length > 0 && (
        <ul className="mt-2 flex gap-1 flex-wrap">
          {note.tags.map((tag) => (
            <li
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface NoteListProps {
  notes: NoteItem[];
  onSelectNote: (id: string) => void;
}

export function NoteList({ notes, onSelectNote }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="py-12 text-center text-gray-400">
        No notes yet. Create your first page.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onSelect={onSelectNote} />
      ))}
    </ul>
  );
}
"""

PAGES = [
    {
        "title": "2026-05-01 — Notebook App Planning",
        "blocks": [
            {
                "type": "text",
                "content": "## Notebook App — Initial Planning\n\nBuilding a Notion-lite personal planner. Users get pages of mixed content blocks: text for notes, todos for task lists, and code snippets with AI-powered explain and refactor actions.\n\n**Core goals:**\n- Fast, keyboard-driven editing\n- Block-level AI actions (no full-page AI, stays scoped)\n- No collaboration for now — single user, simple auth",
                "orderIndex": 0,
            },
            {
                "type": "code",
                "content": NOTE_LIST_COMPONENT,
                "language": "tsx",
                "orderIndex": 1,
            },
            {
                "type": "todo",
                "content": "Scaffold monorepo with /client and /server",
                "orderIndex": 2,
            },
            {
                "type": "todo",
                "content": "Set up Prisma schema and run initial migration",
                "orderIndex": 3,
            },
            {
                "type": "todo",
                "content": "Wire up auth (JWT + HttpOnly cookie)",
                "orderIndex": 4,
            },
        ],
    },
    {
        "title": "2026-05-03 — Stack Decisions",
        "blocks": [
            {
                "type": "text",
                "content": "## Stack Decisions\n\n**Frontend:** React + TypeScript + Vite. Chakra UI for components — has a solid accessible base and plays well with Zustand. TanStack Query for server state so optimistic updates are easy.\n\n**Backend:** Express + TypeScript. Prisma ORM for type-safe queries. PostgreSQL because we need relational integrity (pages → blocks → AI interactions).\n\n**AI:** Anthropic API server-side only. Stream SSE back to the client so the UI feels responsive. Never expose the API key to the frontend.",
                "orderIndex": 0,
            },
            {
                "type": "text",
                "content": "## Risks to watch\n\n- SSE and React state — need to accumulate streamed text in a ref, not state, to avoid excessive re-renders during streaming\n- Block ordering — using integer `orderIndex`; could drift after many edits, may need periodic rebalance later\n- Rate limiting on AI routes — keeping it tight (20 req/hr) to avoid surprise costs",
                "orderIndex": 1,
            },
            {
                "type": "todo",
                "content": "Test SSE streaming in the browser with EventSource",
                "orderIndex": 2,
            },
            {
                "type": "todo",
                "content": "Add ANTHROPIC_API_KEY to .env and docker-compose",
                "orderIndex": 3,
            },
        ],
    },
    {
        "title": "2026-05-05 — Today",
        "blocks": [
            {
                "type": "text",
                "content": "## Today\n\nPhase 1 backend is solid — all REST routes tested and running in Docker. Phase 2 AI endpoints are wired up and streaming. Starting the frontend next.",
                "orderIndex": 0,
            },
            {
                "type": "todo",
                "content": "Build Vite + Chakra UI scaffold",
                "orderIndex": 1,
            },
            {
                "type": "todo",
                "content": "Build login / register pages",
                "orderIndex": 2,
            },
            {
                "type": "todo",
                "content": "Build page list sidebar",
                "orderIndex": 3,
            },
            {
                "type": "todo",
                "content": "Build block editor with code / text / todo types",
                "orderIndex": 4,
            },
        ],
    },
]


def api(opener, base, path, body=None):
    url = f"{base}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST" if data else "GET",
    )
    with opener.open(req) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:3001")
    args = parser.parse_args()
    base = args.base.rstrip("/")

    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    print(f"Seeding {base} ...")

    # Register; fall back to login if the email is already taken
    try:
        result = api(
            opener,
            base,
            "/api/auth/register",
            {"email": "demo@dmnotebook.com", "password": "password123", "name": "Demo User"},
        )
        print(f"  Registered: {result['user']['email']}")
    except urllib.error.HTTPError as e:
        if e.code == 409:
            result = api(
                opener,
                base,
                "/api/auth/login",
                {"email": "demo@dmnotebook.com", "password": "password123"},
            )
            print(f"  Logged in: {result['user']['email']}")
        else:
            print(f"Auth error: {e}", file=sys.stderr)
            sys.exit(1)

    ai_block_id = None

    for page_data in PAGES:
        page = api(opener, base, "/api/pages", {"title": page_data["title"]})
        page_id = page["page"]["id"]
        print(f"\n  Page: {page_data['title']}")
        print(f"    id: {page_id}")

        for block_data in page_data["blocks"]:
            block = api(opener, base, f"/api/pages/{page_id}/blocks", block_data)
            block_id = block["block"]["id"]
            print(f"    block [{block_data['type']}]: {block_id}")

            if block_data["type"] == "code" and ai_block_id is None:
                ai_block_id = block_id

    print("\n" + "=" * 60)
    print("Seed complete.")
    print()
    print("Test the AI explain endpoint:")
    print()
    print(f"  curl -sN --cookie-jar /dev/null \\")
    print(f"       -b <(cat <<'EOF'")
    # Print the cookie in a way that's copyable — simpler to just tell them to re-login
    print(f"  # First log in to get cookies.txt:")
    print(f"  curl -sc cookies.txt -X POST {base}/api/auth/login \\")
    print(f"       -H 'Content-Type: application/json' \\")
    print(f"       -d '{{\"email\":\"demo@dmnotebook.com\",\"password\":\"password123\"}}'")
    print()
    print(f"  # Then stream the explanation:")
    print(f"  curl -sN -b cookies.txt -X POST {base}/api/blocks/{ai_block_id}/explain")
    print("=" * 60)


if __name__ == "__main__":
    main()
