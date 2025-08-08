type PluginDataMap = {
	GMF: GameRegPluginData;
	WRBDummyDataPlugin: WRBDummyData;
	JobMonitor: JobMonitorPluginData;
};

export const ALL_PLUGIN_NAMES = [
	"GMF",
	"WRBDummyDataPlugin",
	"JobMonitor"
] as const;
type PLUGIN_NAMES = keyof PluginDataMap;

export type GameRegPluginData = {
	stuff: {id: string, game: string, place: string}[];
};

export type WRBDummyData = {
	hi: boolean;
};

export type JobMonitorPluginData = {
	lastKnownJobId: string | null;
	targetUserId: number;
	isMonitoring: boolean;
};

export class PluginDataManager {
	private pluginDataMap: Map<PLUGIN_NAMES, PluginDataMap[PLUGIN_NAMES]>;

	constructor() {
		this.pluginDataMap = new Map<
			PLUGIN_NAMES,
			PluginDataMap[PLUGIN_NAMES]
		>();
		this.setPluginData("GMF", {
			stuff: []
		});
		this.setPluginData("WRBDummyDataPlugin", {
			hi: true
		});
		this.setPluginData("JobMonitor", {
			lastKnownJobId: null,
			targetUserId: process.env.JOB_MONITOR_USER_ID ? parseInt(process.env.JOB_MONITOR_USER_ID, 10) : 1083030325,
			isMonitoring: false
		});
	}

	setPluginData<K extends PLUGIN_NAMES>(
		pluginName: K,
		data: PluginDataMap[K]
	): void {
		// console.log('setplugindata..',pluginName, data);
		this.pluginDataMap.set(pluginName, data);
	}

	getPluginData<K extends PLUGIN_NAMES>(
		pluginName: K
	): PluginDataMap[K] | undefined {
		return this.pluginDataMap.get(pluginName) as
			| PluginDataMap[K]
			| undefined;
	}

	hasPluginData(pluginName: PLUGIN_NAMES): boolean {
		return this.pluginDataMap.has(pluginName);
	}

	clearPluginData(pluginName: PLUGIN_NAMES): void {
		this.pluginDataMap.delete(pluginName);
	}

	getAllPluginData(): any {
		const jsonDict: Record<string, any> = {};
		this.pluginDataMap.forEach((value, key) => {
			jsonDict[key] = value;
		});
		return jsonDict;
	}
}

export const WRBPluginData = new PluginDataManager();
