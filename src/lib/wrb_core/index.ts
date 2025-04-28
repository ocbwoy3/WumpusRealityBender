type EventType = "RobloxLogin" | "SelfbotLogin" | "BotLogin";

class EventManager {
	private events: Record<EventType, Array<() => void>> = {
		RobloxLogin: [],
		SelfbotLogin: [],
		BotLogin: [],
	};

	on(event: EventType, callback: () => void): void {
		this.events[event].push(callback);
	}

	emit(event: EventType): void {
		this.events[event].forEach(callback => callback());
	}
}

// Example usage:
export const WRBEevntManager = new EventManager();
