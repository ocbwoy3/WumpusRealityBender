export type udmuxSessionId = {
	/** your ip */
	ClientIpAddress: string;

	/** your real life age */
	Age: 15.987362864179266;

	/** where roblox thinks ur loc at */
	Latitude: number;

	/** where roblox thinks ur loc at */
	Longitude: number;

	/** the country num ur in (latvia is 122) */
	CountryId: 122;

	/** chinese/dutch/etc roblox thing where you can't gamble money */
	PolicyCountryId: any;

	/** skids u have blocked on roblox in the server */
	BlockedPlayerIds: any;

	/** do you have vc */
	IsUserVoiceChatEnabled: boolean;

	/** do u have cam enabled */
	IsUserAvatarVideoEnabled: true;

	/** region of the server */
	GameJoinRegion: string;

	/** ur location for joining it */
	SubdivisionIso: string;
};

export const SubdivisionIsoFriendlyNames = {
	"LV-DGV": "Latvia (Daugavpils)",
	"LV-JEL": "Latvia (Jelgava)",
	"LV-JUR": "Latvia (Jūrmala)",
	"LV-LPX": "Latvia (Liepāja)",
	"LV-REZ": "Latvia (Rēzekne)",
	"LV-RIX": "Latvia (Rīga)",
	"LV-VEN": "Latvia (Ventspils)",
	"LV-VMR": "Latvia (Valmiera)"
};

export type udmuxGameInfo = {
	jobId: string;
	status: number;
	statusData: null;
	joinScriptUrl: `https://assetgame.roblox.com/Game/Join.ashx${string}`;
	authenticationUrl: string;
	authenticationTicket: string;
	message: any;
	joinScript: {
		/** TBD */
		ClientPort: number;

		/** IPv4 / IPv6 */
		MachineAddress: number;

		/** PORT */
		ServerPort: number;

		/** TBD */
		ServerConnections: [];

		/** TBD */
		UdmuxEndpoints: {
			/** IPv4 / IPv6 */
			Address: string;
			Port: string;
		}[];

		/** your user */
		UserName: "iUseNixBTW";

		/** your display */
		DisplayName: "iUseNixBTW";

		/** your public userid */
		UserId: 1083030325;

		/** target placeid */
		PlaceId: number;

		/** some json bs */
		SessionId: string;

		/** Roblox datacenter id */
		DataCenterId: 388;

		/** Your country */
		CountryCode: "LV";

		/** Server RCC version */
		RccVersion: "0.681.0.6810805";
	};
};
