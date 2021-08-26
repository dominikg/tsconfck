export async function loadTS(): Promise<any> {
	try {
		return (await import('typescript')).default;
	} catch (e) {
		console.error('typescript must be installed to use "native" functions');
		throw e;
	}
}
