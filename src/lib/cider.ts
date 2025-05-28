const nowPlayingEndpoint = "http://localhost:10767/api/v1/playback/now-playing";

interface APIResponse<T> {
	status: "ok" | string;
	info: T;
}

type NowPlayingData = {
	name: string;
	artistName: string;
	albumName: string;
	artwork: {
		width: number;
		height: number;
		url: string;
	};
	url: string;
	inLibrary: boolean;
	inFavorites: boolean;
};

export async function getNowPlaying(): Promise<NowPlayingData | null> {
	try {
		const response = await fetch(nowPlayingEndpoint);
		if (!response.ok) {
			throw new Error(`Failed to fetch: ${response.statusText}`);
		}
		const data = await response.json() as APIResponse<NowPlayingData | null>;
		if (data.info && data.status === "ok") {
			return data.info;
		} else {
			console.error(`API error: ${data.status}`);
			return null;
		}
	} catch (error) {
		console.error(`Error fetching now playing: ${error}`);
		return null;
	}
}
