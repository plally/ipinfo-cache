export interface Env {
	IP_STORE: KVNamespace;
}

import { Handler, Hono } from 'hono';
const app = new Hono();

const getIPInfo: Handler = async (c) => {
	const rawIP = c.req.param('ip');
	const ip = decodeURI(rawIP);

	const cachedData = await c.env.IP_STORE.get(ip, { type: 'json' });
	if (cachedData?.ip == ip) {
		return c.json(cachedData);
	}

	const token = c.req.query('token');

	const resp = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
	if (resp.status != 200) {
		return resp;
	}

	const data: any = await resp.json();

	await c.env.IP_STORE.put(
		ip,
		JSON.stringify({
			...data,
			cacheUpdatedAt: Date.now()
		}),
		{ expirationTtl: 43200 }
	);

	return c.json(data);
}
app.get('/ipinfo/:ip', getIPInfo);
app.get('/ipinfo/:ip/json', getIPInfo);

export default app;
