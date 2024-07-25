import * as adapters from './adapters/index.js';

export const resolve = async ({ relations }) => {
	const baseUrl = process.env.PLANE_API_URL;
	const apiKey = process.env.PLANE_API_KEY;
	const alteredRelations = await relations.map(async (url) => {
		if (typeof url === 'string') {
			try {
				const adapter = Object.values(adapters).filter((adapter) => {
					if (typeof adapter === 'function') {
						const matchers = adapter({}).matchers;
						if (!matchers) throw new Error('RegEx validators not found.');
						return matchers.some((matcher) => matcher.test(url));
					} else {
						throw new Error('Adapter not valid.');
					}
				});
				if (adapter.length !== 1 || typeof adapter[0] !== 'function')
					throw new Error('No matching adapter found.');
				return {
					url,
					data: await adapter[0]({ baseUrl, apiKey }).get({ url }),
				};
			} catch (error) {
				return url;
			}
		} else {
			return url;
		}
	});
	const resolvedAlteredRelations = await Promise.all(alteredRelations);
	return resolvedAlteredRelations;
};
