# Ghost Reprint

Interactive UI that leaves a fading afterimage. Click a tool to press an imprint; ghosts drift and dissolve. Memory as interface material.

## Install

```bash
npm install github:neelshha/ghost-reprint
```

```tsx
import { GhostReprint } from "@neelshha/ghost-reprint";
import "@neelshha/ghost-reprint/styles.css";

export function Demo() {
  return <GhostReprint />;
}
```

## Props

| Prop | Default | Description |
|------|---------|-------------|
| `autoPlay` | `false` | Loop a cursor + stamp demo (gallery cards) |
| `autoPlayDuration` | `4200` | Approx. length of one tool-cycle pass |
| `className` | — | Extra class on the root |

## License

MIT
