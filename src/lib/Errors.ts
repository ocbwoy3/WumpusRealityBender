export class GuyBehindScreenError extends Error {
	constructor(message: any) {
		super(message);
		this.name = "GuyBehindScreenError";
	}
}

export class UserInputError extends Error {
	constructor(message: any) {
		super(message);
		this.name = "UserInputError";
	}
}

export class RobloxError extends Error {
	constructor(message: any) {
		super(message);
		this.name = "RobloxError";
	}
}
