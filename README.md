# Chiama Nonna

Sue’s class hub for the Nonna Italian video calls. Students move call → call from one link. Each game still has its own link for solo use.

**Hub:** https://appuccinohub.github.io/chiama-nonna/

GitHub Pages should serve this repo from branch `main`, folder `/` (root).

## Separate games

These stay their own sites. The hub only links out.

1. Weather — https://appuccinohub.github.io/che-tempo-fa-nonna/ — Che tempo fa, Nonna?
2. Food — https://appuccinohub.github.io/cosa-mangiamo-nonna/ — Cosa mangiamo, Nonna?
3. Verbs — https://appuccinohub.github.io/che-fai-oggi-nonna/ — Che fai oggi, Nonna?

On the hub, **Use separately** uses those exact URLs, with no query string.

## What the hub does

- Lists the calls in class order.
- **Start next call** opens the first call that is not done yet. A first visit opens the weather call.
- Progress is saved on the phone in `localStorage` under `chiama-nonna-hub-v1` (which calls are done, and an optional student name).
- **Copy all** copies a short class note: name, date, and which calls are done. Paste it into Google Classroom.
- Coming back with `?done=tempo`, `?done=cibo`, or `?done=fai` marks that call done and highlights **Move on** on the next one. `?from=hub&done=…` does the same.

## Contract for the games

The hub opens a game with `from` and `next` so the game can show **Move on**. A game opened with no query string is solo use and should ignore this.

### Hub → game

| id | Call | URL the hub opens |
| --- | --- | --- |
| `tempo` | Che tempo fa, Nonna? | https://appuccinohub.github.io/che-tempo-fa-nonna/?from=hub&next=cibo |
| `cibo` | Cosa mangiamo, Nonna? | https://appuccinohub.github.io/cosa-mangiamo-nonna/?from=hub&next=fai |
| `fai` | Che fai oggi, Nonna? | https://appuccinohub.github.io/che-fai-oggi-nonna/?from=hub&next=hub |

- `from=hub` means this student came from the class hub.
- `next` is where to send them when the call ends: `cibo`, `fai`, or `hub`.

### Game → next, or back to the hub

When a call finishes and it was opened with `from=hub`, send the student on. Mark the call that just finished. Done ids are `tempo`, `cibo`, and `fai`.

Either path is enough. Doing both is best.

**1. Return to the hub** (the hub then shows **Move on** and **Start next call**):

- https://appuccinohub.github.io/chiama-nonna/?done=tempo
- https://appuccinohub.github.io/chiama-nonna/?done=cibo
- https://appuccinohub.github.io/chiama-nonna/?done=fai

`?from=hub&done=tempo` (and the same for `cibo` and `fai`) works too. `done` is the id of the call that just finished.

**2. Go straight to the next game**, and record the check first.

`localStorage` is shared by every page on `https://appuccinohub.github.io`. Before leaving, merge this key (keep `name` and calls that are already done):

```json
{
  "name": "Arianna",
  "done": { "tempo": true, "cibo": true }
}
```

Key: `chiama-nonna-hub-v1`.

Then open the next target the same way the hub would:

| Just finished | `next` from the query | Open this |
| --- | --- | --- |
| `tempo` | `cibo` | https://appuccinohub.github.io/cosa-mangiamo-nonna/?from=hub&next=fai |
| `cibo` | `fai` | https://appuccinohub.github.io/che-fai-oggi-nonna/?from=hub&next=hub |
| `fai` | `hub` | https://appuccinohub.github.io/chiama-nonna/?done=fai |

`next=hub` always means come back here with `?done=` set to the call that just finished. For the verbs call, that is `done=fai`.

Keep the solo URL working with no query string.

## Adding the next Nonna game

Edit the `CALLS` array in `js/hub.js`. Append one object, in class order:

```js
{
  id: "short-id",
  title: "New title, Nonna?",
  practice: "One line about what you practice.",
  solo: "https://appuccinohub.github.io/new-game/",
  next: "hub"
}
```

Point the previous last call’s `next` at this new `id`. The new call stays last, so its `next` stays `"hub"`. The list, **Start next call**, **Use separately**, and **Copy all** all read that array.

Use the new `id` as `?done=short-id` when that game sends students back.
