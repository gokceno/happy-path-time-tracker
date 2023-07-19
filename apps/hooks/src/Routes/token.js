import jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';
import { createRequire } from "module";
import dotenv from 'dotenv';

dotenv.config();

// Apply some hacks & init Magic
const require = createRequire(import.meta.url);
const { Magic } = require('@magic-sdk/admin');
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

const { sign } = jwt;

const token =  async (req, res, next) => {
	if(process.env.JWT_SECRET == undefined) throw new Error('JWT_SECRET not set.')
	const [type, token] = req.headers['authorization'].split(' ');
	const metadata = await magic.users.getMetadataByToken(token);
	res.json({
		metadata,
		token: sign(
			{ email: metadata.email }, 
			process.env.JWT_SECRET, 
			{ expiresIn: process.env.JWT_EXPIRES || '1h' }
		)
	});
}

export { token }