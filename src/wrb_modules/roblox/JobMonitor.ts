import { BotClient } from "bot";
import { getPresences, UserPresence } from "noblox.js";
import { WRBEevntManager, WRBPluginData } from "../../lib/wrb_core";

// Configuration
const MONITOR_INTERVAL = 10000; // 10 seconds
const TARGET_USER_ID = process.env.JOB_MONITOR_USER_ID ? parseInt(process.env.JOB_MONITOR_USER_ID, 10) : 1083030325;

WRBEevntManager.on("RobloxLogin", async () => {
	// Get plugin data
	const pluginData = WRBPluginData.getPluginData("JobMonitor");
	if (!pluginData) {
		console.error("[JobMonitor] Failed to get plugin data");
		return;
	}

	const targetUserId = pluginData.targetUserId;
	console.log(`[JobMonitor] Starting to monitor user ${targetUserId} for job changes`);
	console.log(`[JobMonitor] Using environment variable JOB_MONITOR_USER_ID: ${process.env.JOB_MONITOR_USER_ID || 'Not set (using default: 1083030325)'}`);

	// Mark as monitoring
	WRBPluginData.setPluginData("JobMonitor", {
		...pluginData,
		isMonitoring: true
	});

	setInterval(async () => {
		try {
			// Get current plugin data
			const currentData = WRBPluginData.getPluginData("JobMonitor");
			if (!currentData) return;

			console.log(`[JobMonitor] Checking user ${targetUserId} - Last known job: ${currentData.lastKnownJobId || 'None'}`);

			// Get the user's presence
			const presences = await getPresences([targetUserId]);
			const userPresence = presences.userPresences[0];

			if (!userPresence) {
				console.log(`[JobMonitor] Could not get presence for user ${targetUserId}`);
				return;
			}

			// Check if user is in a game
			if (userPresence.userPresenceType !== 2 || !userPresence.gameId) {
				// User is not in a game, clear the last known job ID
				if (currentData.lastKnownJobId !== null) {
					console.log(`[JobMonitor] User ${targetUserId} left game (was in job: ${currentData.lastKnownJobId})`);
					WRBPluginData.setPluginData("JobMonitor", {
						...currentData,
						lastKnownJobId: null
					});
				}
				return;
			}

			// User is in a game, check if job ID changed
			const currentJobId = userPresence.gameId.toString();

			// Send notification if:
			// 1. User just joined a game (lastKnownJobId is null)
			// 2. User changed jobs (lastKnownJobId is different from current)
			if (currentData.lastKnownJobId === null) {
				// User just joined a game
				console.log(`[JobMonitor] User ${targetUserId} joined game with job: ${currentJobId}`);
				await sendJobChangeNotification(targetUserId, "None", currentJobId, userPresence);
			} else if (currentData.lastKnownJobId !== currentJobId) {
				// Job ID changed! Send notification
				console.log(`[JobMonitor] Job change detected for user ${targetUserId}: ${currentData.lastKnownJobId} -> ${currentJobId}`);
				await sendJobChangeNotification(targetUserId, currentData.lastKnownJobId, currentJobId, userPresence);
			} else {
				// Same job, just log for debugging
				console.log(`[JobMonitor] User ${targetUserId} still in same job: ${currentJobId}`);
			}

			// Update the last known job ID
			WRBPluginData.setPluginData("JobMonitor", {
				...currentData,
				lastKnownJobId: currentJobId
			});

		} catch (error) {
			console.error(`[JobMonitor] Error monitoring user ${targetUserId}:`, error);
		}
	}, MONITOR_INTERVAL);
});

async function sendJobChangeNotification(
	userId: number,
	oldJobId: string,
	newJobId: string,
	presence: UserPresence
) {
	try {
		const message = `# game state changed` +
			`**User:** ${userId}\n` +
			`**Previous Job:** \`${oldJobId}\`\n` +
			`**New Job:** \`${newJobId}\`\n` +
			`**Place ID:** \`${presence.placeId || 'Unknown'}\`\n` +
			`**Universe ID:** \`${presence.universeId || 'Unknown'}\`\n\n` +
			`**Join Command (Linux):** \`\`\`bash\nxdg-open roblox://placeId=${presence.placeId}&jobId=${newJobId}\n\`\`\``;

		// Send DM to owner (same pattern as ReviewDB.ts)
		try {
			(await BotClient.users.createDM(process.env.OWNER_ID!)).send({
				content: message
			});
		} catch (error) {
			console.error(`[JobMonitor] Failed to send DM:`, error);
		}

	} catch (error) {
		console.error(`[JobMonitor] Failed to send notification:`, error);
	}
}

console.log("[INFO] WRB Module Loaded: JobMonitor");
