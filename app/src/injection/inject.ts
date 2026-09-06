import { buildBridgeRuntime } from './bridge-runtime';
import { buildCastShim } from './cast-shim';
import {
  buildPictureInPictureShim,
  type PictureInPictureShimMode,
} from './picture-in-picture-shim';
import { buildPlaybackAwakeShim } from './playback-awake-shim';
import { USERSCRIPT_SOURCE } from './userscript-source';
import { buildAndroidTvRemoteShim } from './android-tv-remote';

export function buildInjectedJavaScript(
  options: {
    pictureInPictureMode?: PictureInPictureShimMode;
    mediaProxyRoutingEnabled?: boolean;
    mediaProxyCapabilityEnabled?: boolean;
    mediaProxyXhrRoutingEnabled?: boolean;
    journalConsoleEnabled?: boolean;
    mediaProxyScheme?: string | null;
    androidTvRemoteEnabled?: boolean;
  } = {},
): string {
  const castShim = buildCastShim();

  const pipShim = buildPictureInPictureShim(
    options.pictureInPictureMode ?? 'disabled',
  );

  const playbackAwakeShim = buildPlaybackAwakeShim();

  const bridge = buildBridgeRuntime({
    mediaProxyRoutingEnabled: options.mediaProxyRoutingEnabled,
    mediaProxyCapabilityEnabled: options.mediaProxyCapabilityEnabled,
    mediaProxyXhrRoutingEnabled: options.mediaProxyXhrRoutingEnabled,
    journalConsoleEnabled: options.journalConsoleEnabled,
    mediaProxyScheme: options.mediaProxyScheme,
  });

  const androidTvRemote = buildAndroidTvRemoteShim(
    options.androidTvRemoteEnabled === true,
  );

  return `
${castShim}

${pipShim}

${playbackAwakeShim}

${bridge}

${androidTvRemote}

// --- Userscript Movix ---
${USERSCRIPT_SOURCE}

true;
`;
}
