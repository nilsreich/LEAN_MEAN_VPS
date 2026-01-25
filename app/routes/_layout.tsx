import { createRoute } from "honox/factory";

export default createRoute((c) => {
	return c.render(
		<html lang="de">
			<head>
				<meta charset="UTF-8" />
				<title>Lean App 2026</title>
				<script type="module" src="/src/client.ts"></script>
			</head>
			<body class="bg-gray-950 text-white min-h-screen">
				<main class="p-6"></main>
			</body>
		</html>,
	);
});
