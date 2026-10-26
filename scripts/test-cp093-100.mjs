import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {receiveZoomWebhook} from '../apps/api/src/zoom-webhook-http.ts';
const main=readFileSync(new URL('../apps/api/src/main.ts',import.meta.url),'utf8');
let passes=0;
for(const item of [
 [main.includes('rawBody: true'),'Nest server enables raw-body preservation'],
 [main.includes("@Controller('v1/integrations/zoom')"),'Webhook controller path'],
 [main.includes("@Post('webhook')"),'Webhook POST method'],
 [main.includes('request.rawBody'),'Uses provider raw bytes'],
 [main.includes('ZOOM_WEBHOOK_SECRET'),'Secret server-side only'],
 [main.includes('ZoomWebhookController]'),'Controller is registered'],
 [!main.includes('attendance.update'),'No direct canonical attendance mutation'],
]){assert.ok(item[0],item[1]);passes++}
const db={connect:async()=>{throw Error('DB must not be used for invalid request')}};
assert.deepEqual(await receiveZoomWebhook({pool:db,rawBody:'not raw',signature:'x',timestamp:'1',secret:'s',nowSeconds:1}),{status:400,body:{outcome:'rejected'}});passes++;
assert.deepEqual(await receiveZoomWebhook({pool:db,rawBody:Buffer.from('{}'),signature:'bad',timestamp:'1',secret:'s',nowSeconds:1}),{status:401,body:{outcome:'rejected'}});passes++;
console.log(`${passes}/${passes} CP093-100 webhook route boundary tests PASS`);
