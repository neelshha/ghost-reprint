# Ghost Reprint

A confirmation modal that leaves a colored afterimage. **Delete** reprints a red ripple; **Keep** reprints a constructive green one.

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
| `autoPlay` | `false` | Loop a cursor + ripple demo (gallery cards) |
| `autoPlayDuration` | `4200` | Approx. length of one Keep → Delete pass |
| `className` | — | Extra class on the root |

## License

MIT
