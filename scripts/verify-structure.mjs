import { existsSync } from "node:fs";
const needed=["apps/web/app/page.tsx","apps/api/src/main.ts","apps/web/package.json","apps/api/package.json","docs/ci-workflow-disabled.example.yml"];
for(const item of needed){if(!existsSync(item))throw new Error(`Missing ${item}`)}
console.log("STRUCTURE PASS: "+needed.length+" required files");
