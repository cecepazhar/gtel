
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const NODE_ENV: string;
	export const HERMES_HOME: string;
	export const OLDPWD: string;
	export const npm_node_execpath: string;
	export const HERMES_STARTUP_WATCHDOG_TIMEOUT_S: string;
	export const MOA_TOOLS_DEBUG: string;
	export const TERMINAL_DOCKER_IMAGE: string;
	export const TERMINAL_CONTAINER_PERSISTENT: string;
	export const HERMES_SESSION_KEY: string;
	export const MAIL: string;
	export const npm_config_global_prefix: string;
	export const TERMINAL_DOCKER_IMAGE_PINNED: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const TERMINAL_MODAL_MODE: string;
	export const HERMES_SESSION_USER_NAME: string;
	export const LESSOPEN: string;
	export const TERMINAL_CONTAINER_DISK: string;
	export const IMAGE_TOOLS_DEBUG: string;
	export const npm_config_userconfig: string;
	export const TERMINAL_TIMEOUT: string;
	export const LANG: string;
	export const TAURI_CLI_VERBOSITY: string;
	export const HOME: string;
	export const TERMINAL_DOCKER_SNAP_COMPAT: string;
	export const HERMES_MEDIA_TRUST_RECENT_SECONDS: string;
	export const TAURI_ENV_ARCH: string;
	export const TERMINAL_TEMP_DIR: string;
	export const HERMES_BROWSER_CONTROL_PRINCIPAL: string;
	export const HERMES_MEDIA_DELIVERY_STRICT: string;
	export const npm_package_version: string;
	export const BROWSER_SESSION_TIMEOUT: string;
	export const TAURI_ENV_PLATFORM_VERSION: string;
	export const XDG_DATA_DIRS: string;
	export const TAURI_ENV_PLATFORM: string;
	export const HERMES_SESSION_PROFILE: string;
	export const HERMES_SESSION_ID: string;
	export const npm_command: string;
	export const HERMES_SESSION_PARENT_CHAT_ID: string;
	export const PWD: string;
	export const HERMES_SESSION_SCOPE_ID: string;
	export const HERMES_SESSION_PLATFORM: string;
	export const TERMINAL_DEGRADED_MODE: string;
	export const HOSTNAME: string;
	export const ZA126_PRO_API_KEY: string;
	export const npm_config_noproxy: string;
	export const TERMINAL_CONTAINER_CPU: string;
	export const TAURI_ENV_FAMILY: string;
	export const TERMINAL_DOCKER_EXTRA_ARGS: string;
	export const HERMES_SESSION_USER_ID: string;
	export const WEB_TOOLS_DEBUG: string;
	export const TERMINAL_MODAL_IMAGE: string;
	export const HISTCONTROL: string;
	export const npm_config_npm_version: string;
	export const HERMES_CRON_SESSION: string;
	export const INVOCATION_ID: string;
	export const TERMINAL_DOCKER_FORWARD_ENV: string;
	export const TERMINAL_SINGULARITY_IMAGE: string;
	export const npm_config_cache: string;
	export const NODE: string;
	export const SVELTEKIT_FORK: string;
	export const TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE: string;
	export const TERMINAL_LIFETIME_SECONDS: string;
	export const HERMES_SESSION_CHAT_ID: string;
	export const npm_lifecycle_script: string;
	export const HERMES_BROWSER_CONTROL_TRANSPORT_FAMILY: string;
	export const npm_config_globalconfig: string;
	export const EDITOR: string;
	export const HERMES_UI_SESSION_ID: string;
	export const GIT_PAGER: string;
	export const group_sessions_per_user: string;
	export const BROWSER_INACTIVITY_TIMEOUT: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const LOGNAME: string;
	export const SHELL: string;
	export const TERMINAL_DOCKER_RUN_AS_HOST_USER: string;
	export const HERMES_SUPERVISED_CHILD: string;
	export const npm_config_init_module: string;
	export const TERMINAL_HOME_MODE: string;
	export const SYSTEMD_EXEC_PID: string;
	export const TERMINAL_DOCKER_SHM_SIZE: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const npm_package_name: string;
	export const npm_config_local_prefix: string;
	export const TERMINAL_DOCKER_NETWORK: string;
	export const COLOR: string;
	export const HERMES_SESSION_USER_ID_ALT: string;
	export const HERMES_EXEC_ASK: string;
	export const TERMINAL_VERCEL_RUNTIME: string;
	export const _HERMES_GATEWAY: string;
	export const HERMES_CUSTOM_100_76_150_46_20128_API_KEY: string;
	export const _: string;
	export const HERMES_SCRATCH_DIR: string;
	export const HERMES_MEDIA_TRUST_RECENT_FILES: string;
	export const HERMES_AGENT: string;
	export const BROWSERBASE_PROXIES: string;
	export const GPG_TTY: string;
	export const MANAGERPID: string;
	export const TERMINAL_DOCKER_SHARED_CONTAINER_KEY: string;
	export const TAURI_ENV_DEBUG: string;
	export const DEBUGINFOD_URLS: string;
	export const XDG_RUNTIME_DIR: string;
	export const HERMES_TURN_LEASE_TIMEOUT: string;
	export const VISION_TOOLS_DEBUG: string;
	export const TERMINAL_DOCKER_ENV: string;
	export const TAURI_ENV_TARGET_TRIPLE: string;
	export const HERMES_QUIET: string;
	export const npm_config_node_gyp: string;
	export const HERMES_SESSION_MESSAGE_ID: string;
	export const npm_config_prefix: string;
	export const HISTSIZE: string;
	export const HERMES_GATEWAY_PLATFORM_CONNECT_TIMEOUT: string;
	export const BROWSERBASE_ADVANCED_STEALTH: string;
	export const HERMES_REAL_HOME: string;
	export const TERMINAL_CONTAINER_MEMORY: string;
	export const HERMES_SESSION_CHAT_TYPE: string;
	export const USER: string;
	export const INIT_CWD: string;
	export const TEMP: string;
	export const HERMES_SESSION_CHAT_NAME: string;
	export const npm_lifecycle_event: string;
	export const HERMES_CUSTOM_LOCALHOST_20128_API_KEY: string;
	export const DEBUGINFOD_IMA_CERT_PATH: string;
	export const SHLVL: string;
	export const PAGER: string;
	export const TERMINAL_DAYTONA_IMAGE: string;
	export const HERMES_GATEWAY_BUSY_INPUT_MODE: string;
	export const TERMINAL_PERSISTENT_SHELL: string;
	export const MANAGERPIDFDID: string;
	export const npm_config_user_agent: string;
	export const TERMINAL_CWD: string;
	export const _config_version: string;
	export const AI_AGENT: string;
	export const JOURNAL_STREAM: string;
	export const HERMES_SESSION_THREAD_ID: string;
	export const npm_package_json: string;
	export const TERMINAL_DOCKER_VOLUMES: string;
	export const PATH: string;
	export const HERMES_SESSION_SOURCE: string;
	export const npm_execpath: string;
	export const TERMINAL_ENV: string;
	export const HERMES_MAX_ITERATIONS: string;
	export const TERMINAL_VERCEL_IMAGE: string;
	export const TMP: string;
	export const TMPDIR: string;
	export const npm_config_allow_scripts: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		NODE_ENV: string;
		HERMES_HOME: string;
		OLDPWD: string;
		npm_node_execpath: string;
		HERMES_STARTUP_WATCHDOG_TIMEOUT_S: string;
		MOA_TOOLS_DEBUG: string;
		TERMINAL_DOCKER_IMAGE: string;
		TERMINAL_CONTAINER_PERSISTENT: string;
		HERMES_SESSION_KEY: string;
		MAIL: string;
		npm_config_global_prefix: string;
		TERMINAL_DOCKER_IMAGE_PINNED: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		TERMINAL_MODAL_MODE: string;
		HERMES_SESSION_USER_NAME: string;
		LESSOPEN: string;
		TERMINAL_CONTAINER_DISK: string;
		IMAGE_TOOLS_DEBUG: string;
		npm_config_userconfig: string;
		TERMINAL_TIMEOUT: string;
		LANG: string;
		TAURI_CLI_VERBOSITY: string;
		HOME: string;
		TERMINAL_DOCKER_SNAP_COMPAT: string;
		HERMES_MEDIA_TRUST_RECENT_SECONDS: string;
		TAURI_ENV_ARCH: string;
		TERMINAL_TEMP_DIR: string;
		HERMES_BROWSER_CONTROL_PRINCIPAL: string;
		HERMES_MEDIA_DELIVERY_STRICT: string;
		npm_package_version: string;
		BROWSER_SESSION_TIMEOUT: string;
		TAURI_ENV_PLATFORM_VERSION: string;
		XDG_DATA_DIRS: string;
		TAURI_ENV_PLATFORM: string;
		HERMES_SESSION_PROFILE: string;
		HERMES_SESSION_ID: string;
		npm_command: string;
		HERMES_SESSION_PARENT_CHAT_ID: string;
		PWD: string;
		HERMES_SESSION_SCOPE_ID: string;
		HERMES_SESSION_PLATFORM: string;
		TERMINAL_DEGRADED_MODE: string;
		HOSTNAME: string;
		ZA126_PRO_API_KEY: string;
		npm_config_noproxy: string;
		TERMINAL_CONTAINER_CPU: string;
		TAURI_ENV_FAMILY: string;
		TERMINAL_DOCKER_EXTRA_ARGS: string;
		HERMES_SESSION_USER_ID: string;
		WEB_TOOLS_DEBUG: string;
		TERMINAL_MODAL_IMAGE: string;
		HISTCONTROL: string;
		npm_config_npm_version: string;
		HERMES_CRON_SESSION: string;
		INVOCATION_ID: string;
		TERMINAL_DOCKER_FORWARD_ENV: string;
		TERMINAL_SINGULARITY_IMAGE: string;
		npm_config_cache: string;
		NODE: string;
		SVELTEKIT_FORK: string;
		TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE: string;
		TERMINAL_LIFETIME_SECONDS: string;
		HERMES_SESSION_CHAT_ID: string;
		npm_lifecycle_script: string;
		HERMES_BROWSER_CONTROL_TRANSPORT_FAMILY: string;
		npm_config_globalconfig: string;
		EDITOR: string;
		HERMES_UI_SESSION_ID: string;
		GIT_PAGER: string;
		group_sessions_per_user: string;
		BROWSER_INACTIVITY_TIMEOUT: string;
		MEMORY_PRESSURE_WATCH: string;
		LOGNAME: string;
		SHELL: string;
		TERMINAL_DOCKER_RUN_AS_HOST_USER: string;
		HERMES_SUPERVISED_CHILD: string;
		npm_config_init_module: string;
		TERMINAL_HOME_MODE: string;
		SYSTEMD_EXEC_PID: string;
		TERMINAL_DOCKER_SHM_SIZE: string;
		MEMORY_PRESSURE_WRITE: string;
		npm_package_name: string;
		npm_config_local_prefix: string;
		TERMINAL_DOCKER_NETWORK: string;
		COLOR: string;
		HERMES_SESSION_USER_ID_ALT: string;
		HERMES_EXEC_ASK: string;
		TERMINAL_VERCEL_RUNTIME: string;
		_HERMES_GATEWAY: string;
		HERMES_CUSTOM_100_76_150_46_20128_API_KEY: string;
		_: string;
		HERMES_SCRATCH_DIR: string;
		HERMES_MEDIA_TRUST_RECENT_FILES: string;
		HERMES_AGENT: string;
		BROWSERBASE_PROXIES: string;
		GPG_TTY: string;
		MANAGERPID: string;
		TERMINAL_DOCKER_SHARED_CONTAINER_KEY: string;
		TAURI_ENV_DEBUG: string;
		DEBUGINFOD_URLS: string;
		XDG_RUNTIME_DIR: string;
		HERMES_TURN_LEASE_TIMEOUT: string;
		VISION_TOOLS_DEBUG: string;
		TERMINAL_DOCKER_ENV: string;
		TAURI_ENV_TARGET_TRIPLE: string;
		HERMES_QUIET: string;
		npm_config_node_gyp: string;
		HERMES_SESSION_MESSAGE_ID: string;
		npm_config_prefix: string;
		HISTSIZE: string;
		HERMES_GATEWAY_PLATFORM_CONNECT_TIMEOUT: string;
		BROWSERBASE_ADVANCED_STEALTH: string;
		HERMES_REAL_HOME: string;
		TERMINAL_CONTAINER_MEMORY: string;
		HERMES_SESSION_CHAT_TYPE: string;
		USER: string;
		INIT_CWD: string;
		TEMP: string;
		HERMES_SESSION_CHAT_NAME: string;
		npm_lifecycle_event: string;
		HERMES_CUSTOM_LOCALHOST_20128_API_KEY: string;
		DEBUGINFOD_IMA_CERT_PATH: string;
		SHLVL: string;
		PAGER: string;
		TERMINAL_DAYTONA_IMAGE: string;
		HERMES_GATEWAY_BUSY_INPUT_MODE: string;
		TERMINAL_PERSISTENT_SHELL: string;
		MANAGERPIDFDID: string;
		npm_config_user_agent: string;
		TERMINAL_CWD: string;
		_config_version: string;
		AI_AGENT: string;
		JOURNAL_STREAM: string;
		HERMES_SESSION_THREAD_ID: string;
		npm_package_json: string;
		TERMINAL_DOCKER_VOLUMES: string;
		PATH: string;
		HERMES_SESSION_SOURCE: string;
		npm_execpath: string;
		TERMINAL_ENV: string;
		HERMES_MAX_ITERATIONS: string;
		TERMINAL_VERCEL_IMAGE: string;
		TMP: string;
		TMPDIR: string;
		npm_config_allow_scripts: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
