---
name: maden-deploy
description: Deploy maden — the fork pulled, the extension rebuilt. Trigger on "deploy maden".
---

```sh
cd "$MADEN_REPO"
git pull
npm install
npm run build
```

Then `Developer: Reload Window`.
