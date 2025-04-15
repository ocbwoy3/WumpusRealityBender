import { randomUUIDv7 } from "bun";

type RecommendationEntry = {
	contentType: "Game" | string;
	contentId: number;
	contentStringId: string;
	contentMetadata: {
		Score: string;
	};
};

type RecommendationSort = {
	topic: string;
	topicId: number;
	treatmentType: string;
	recommendationList: RecommendationEntry[];
	nextPageTokenForTopic: null;
	numberOfRows: number;
	topicLayoutData: any;
};

export type ContentMetadata = {
	totalUpVotes: number;
	totalDownVotes: number;
	universeId: number;
	name: string;
	rootPlaceId: number;
	description: null;
	playerCount: number;
	primaryMediaAsset: any;
	under9: boolean;
	under13: boolean;
	minimumAge: number;
	ageRecommendationDisplayName: string;
	friendVisits: any[];
	friendVisitedString: string;
	layoutDataBySort: any;
};

export type OmniRecommendation = {
	pageType: "Home" | string;
	requestId: string;
	sortsRefreshInterval: number;
	contentMetadata: {
		Game: { [id: string]: ContentMetadata };
		CatalogAsset: any;
		CatalogBundle: any;
		RecommendedFriend: any;
		GameCoPlay: any;
	};
	nextPageToken: string;
	isSessionExpired: boolean;
	globalLayoutData: any;
	isPartialFeed: boolean;
	DebugInfoGroups: boolean;
	sorts: RecommendationSort[];
};

export async function getOmniRecommendationsHome(): Promise<OmniRecommendation> {
	const data = await fetch(
		`https://apis.roblox.com/discovery-api/omni-recommendation`,
		{
			method: "POST",
			headers: {
				"User-Agent": "OCbwoy3ChanAI/1.0",
				Accept: "application/json, text/plain, */*",
				"Accept-Encoding": "gzip, deflate, br, zstd",
				"Content-Type": "application/json;charset=UTF-8",
				Cookie: `.ROBLOSECURITY=${process.env.ROBLOSECURITY!}`
			},
			body: JSON.stringify({
				pageType: "Home",
				sessionId: randomUUIDv7(),
				supportedTreatmentTypes: ["SortlessGrid"],
				authIntentData: null,
				cpuCores: 4,
				maxResolution: "1920x1080",
				maxMemory: 8192
			})
		}
	);
	return (await data.json()) as OmniRecommendation;
}

// https://apis.roblox.com/discovery-api/omni-recommendation
