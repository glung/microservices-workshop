import { prisma } from "./prisma";

export const initDB = async () => {
	try {
		await prisma.$connect();
		console.log("users database OK");
	} catch (error) {
		console.error("users unable to connect to the database:", error);
		process.exit(1); 
	}
};