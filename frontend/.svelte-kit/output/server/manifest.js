export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.Dc_mlXHL.js",app:"_app/immutable/entry/app.UCvdYF5E.js",imports:["_app/immutable/entry/start.Dc_mlXHL.js","_app/immutable/chunks/CSVaV_es.js","_app/immutable/chunks/CVMS1WXu.js","_app/immutable/chunks/6Hkl-Xvh.js","_app/immutable/entry/app.UCvdYF5E.js","_app/immutable/chunks/CSVaV_es.js","_app/immutable/chunks/C5tk7xz4.js","_app/immutable/chunks/uSpEP1ed.js","_app/immutable/chunks/6Hkl-Xvh.js","_app/immutable/chunks/DDQnJ7UP.js","_app/immutable/chunks/DQaZpj3z.js","_app/immutable/chunks/Cxb6TstV.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/agent-health",
				pattern: /^\/agent-health\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
