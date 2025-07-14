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


export class ExternalAPIError extends Error {
	constructor(message: any) {
		super(message);
		this.name = "ExternalAPIError";
	}
}


export class SuperError extends Error {
	constructor(service: string, message: any) {
		super(message);
		this.name = service + "Error";
	}
}
