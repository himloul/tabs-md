# tabs-md

Export your open tabs as a markdown list — and bring them back. A tiny MV3
extension for Brave/Chrome with no background worker, no dependencies, no
tracking. ~0 MB at rest.

## Features

- **Export** — every open tab as a markdown list, grouped by window, deduped,
  pinned/internal pages skipped. Copy or download a timestamped `.md` file.
- **Selective** — check/uncheck tabs; every action operates on your selection.
- **Open selected** — reopen chosen tabs in a fresh window.
- **Import / reopen** — paste a markdown list or pick a `.md` file and reopen
  all its links in a new window.
- **Merge windows** — consolidate every window's tabs into the current one.
- **Archive & close** — save the list to Downloads, copy to clipboard, then
  close the selected tabs.

## Install (load unpacked)

1. `brave://extensions` (or `chrome://extensions`)
2. Enable **Developer mode**
3. **Load unpacked** → select this folder
4. Pin it from the extensions menu for one-click access

## Usage

Click the toolbar icon → the popup lists your tabs with favicons and
checkboxes. Select what you want and pick an action: Open / Copy / Download /
Archive & close. The **Import** tab accepts pasted links or a `.md` file.

## Privacy

Everything stays on your machine. No network calls, no data collection, no
permissions beyond `tabs` (needed to read tab titles/URLs).

## License

MIT
