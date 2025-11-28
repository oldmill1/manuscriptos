export const load = async ({ params }: { params: { path: string } }) => {
	// params.path comes as a string like "fe39192a-b8b0-4837-a812-f0062e4ee66f"
	// Split it into an array
	const pathArray = params.path ? params.path.split('/') : [];
	return {
		path: pathArray
	};
};
