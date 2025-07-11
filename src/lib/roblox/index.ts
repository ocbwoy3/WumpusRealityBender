import { setCookie } from "noblox.js";

export async function loginRoblox() {
	const user = await setCookie(process.env.ROBLOSECURITY!);
	console.log(
		`[ROBLOX] Logged in as ${user.displayName} (@${user.name}) ID: ${user.id}`
	);
}

export async function getServerUDMUXDetails(
	placeId: string,
	gameId: string
): Promise<any> {
	const res = await fetch(
		`https://gamejoin.roblox.com/v1/join-game-instance`,
		{
			method: "POST",
			headers: {
				Cookie: `.ROBLOSECURITY=${process.env.ROBLOSECURITY};`,
				"Content-Type": "application/json",
				"User-Agent": "Roblox/WinInet"
			},
			body: JSON.stringify({ placeId, gameId })
		}
	);

	return await res.json();
}
