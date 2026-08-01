# tabs-md

Open tabs are ephemeral. tabs-md turns them into a durable, readable markdown
list you can keep anywhere and reopen later.

Works in Brave and Chrome. MV3. No background worker, no dependencies, no
network calls.

## What it does

- Lists every open tab as markdown, grouped by window, deduped, pinned and
  browser-internal pages skipped
- Strips common tracking params (utm_*, click IDs, and similar noise); Google
  search links are collapsed to the query
- Acts on a selection: check/uncheck tabs, then Open (new window), Copy,
  Download, or Archive & close
- Import: paste a list or pick a .md file, reopen all links in a new window
- Merges this browser's windows into the current one
- Archive & close: saves the list to Downloads, copies it to clipboard, closes
  the selected tabs

## Install

1. Open brave://extensions (or chrome://extensions)
2. Enable Developer mode
3. Load unpacked, select this folder
4. Pin the toolbar icon

## Permissions

One: "tabs" (reads tab titles and URLs). Nothing leaves your machine.

## License

MIT
