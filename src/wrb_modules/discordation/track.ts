import { SelfbotClient } from "selfbot";

console.log("HEY GUYS IT LOADED WATCH OUT")

const legacyPH = "1224633346467037194";
const myself = "486147449703104523";

SelfbotClient.on("presenceUpdate",async(u)=>{
	if (u) {
		// embedded - discord xbox
		const secondLongString = [
			u.clientStatus?.desktop ? `Desktop ${u.clientStatus.desktop}` : null,
			u.clientStatus?.mobile ? `Mobile ${u.clientStatus.mobile}` : null,
			u.clientStatus?.web ? `Web ${u.clientStatus.web}` : null,
			(u.clientStatus as any)?.embedded ? `Console ${(u.clientStatus as any).embedded}` : null
		].filter(a=>!!a).join(", ");
		const longAssString = (u.activities || []).map(a=>`[${a.name}] ${a.details}${a.state ? ` (${a.state})` : ""}`).join(", ")
		console.log(`${u.user?.username}#${u.user?.discriminator || "0"} [${secondLongString}] updated their status: ${longAssString}`)
	}
})
