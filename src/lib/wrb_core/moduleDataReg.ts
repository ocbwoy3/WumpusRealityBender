type PluginDataMap = {
	AntiDandysWorld: AntiDandysWorldPluginData;
	WRBDummyDataPlugin: WRBDummyData;
};

export const ALL_PLUGIN_NAMES = ["AntiDandysWorld", "WRBDummyDataPlugin"] as const;
type PLUGIN_NAMES = keyof PluginDataMap;

export type AntiDandysWorldPluginData = {
	friendsPlaying: number[];
};

export type WRBDummyData = {
	hi: boolean;
};

export class PluginDataManager {
	private pluginDataMap: Map<PLUGIN_NAMES, PluginDataMap[PLUGIN_NAMES]>;

	constructor() {
		this.pluginDataMap = new Map<
			PLUGIN_NAMES,
			PluginDataMap[PLUGIN_NAMES]
		>();
		this.setPluginData("AntiDandysWorld", {
			friendsPlaying: []
		});
		this.setPluginData("WRBDummyDataPlugin", {
			hi: true
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
		return this.pluginDataMap.get(pluginName) as PluginDataMap[K] | undefined;
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
