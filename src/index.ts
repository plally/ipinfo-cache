/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  IP_STORE: KVNamespace;
}

import { Hono } from 'hono'
const app = new Hono()
 
app.get('/ipinfo/:ip', async (c) => {
  const rawIP = c.req.param('ip')
  const ip = decodeURI(rawIP)

  const cachedData = await c.env.IP_STORE.get(ip, {type:"json"})
  if(cachedData?.ip == ip) {
    return c.json(cachedData)
  }

  const token = c.req.query('token')

  const resp = await fetch(`https://ipinfo.io/${ip}?token=${token}`)
  if(resp.status != 200){
    return resp
  }

  const data: any = await resp.json()
    
  await c.env.IP_STORE.put(ip, JSON.stringify({
    ...data,
    cacheUpdatedAt: Date.now()
  }), {expirationTtl: 86400 })

  return c.json(data)
})
 
 export default app