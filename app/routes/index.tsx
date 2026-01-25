import { createRoute } from "honox/factory";

export default createRoute((c) => {
	return c.render(
		<div class="max-w-xl mx-auto text-center py-20">
			<h1 class="text-5xl font-bold mb-4">Willkommen</h1>
			<p class="text-gray-400">
				Dies ist deine ultra-schlanke Full-Stack App auf 512MB RAM.
			</p>
		</div>,
	);
});
