import { setCookie } from "noblox.js";

export async function loginRoblox() {
	const user = await setCookie(process.env.ROBLOSECURITY!);
	console.log(`[ROBLOX] Logged in as ${user.displayName} (@${user.name}) ID: ${user.id}`)
}
