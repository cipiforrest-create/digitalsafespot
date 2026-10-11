export const cinematicConfig = {
  mobileBreakpoint: 760,
  scrollViewportsPerScene: 3.75,
  responseMs: 85,
  // Total burst size, with frame 1 requested before the rest of the window.
  heroOpeningFrames: { desktop: 12, mobile: 8 },
  sceneOpeningFrames: { desktop: 12, mobile: 8 },
  idleWarmBatch: { desktop: 4, mobile: 2 },
  scene3PreloadAt: { desktop: 0.62, mobile: 0.68 },
  // Mobile uses a shorter dissolve and smaller preload windows to reduce
  // simultaneous decoding while retaining every source frame.
  transition: {
    from: 'scene-02',
    to: 'scene-03',
    overlapRatio: { desktop: 0.15, mobile: 0.12 },
    scale: 0.012,
    brightness: 0.04,
  },
  scenes: [
    { id: 'scene-01', desktop: 241, mobile: 241 },
    { id: 'scene-02', desktop: 241, mobile: 241 },
    { id: 'scene-03', desktop: 241, mobile: 241 },
  ],
};

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function temporalLayer(scene, sceneIndex, localPosition, visual = {}) {
  const local = clamp(localPosition, 0, scene.count - 1);
  const assetPosition = scene.offset + local;
  const from = Math.floor(assetPosition);
  const to = Math.min(scene.offset + scene.count - 1, Math.ceil(assetPosition));
  return {
    sceneIndex,
    local,
    assetPosition,
    from,
    to,
    alpha: assetPosition - from,
    opacity: visual.opacity ?? 1,
    scale: visual.scale ?? 1,
    brightness: visual.brightness ?? 1,
  };
}

export function createTimeline(variant = 'desktop') {
  let assetOffset = 0;
  const scenes = cinematicConfig.scenes.map((scene, sceneIndex) => {
    const result = {
      ...scene,
      sceneIndex,
      offset: assetOffset,
      count: scene[variant],
      playbackStart: 0,
    };
    assetOffset += result.count;
    return result;
  });

  const transitions = [];
  for (let index = 1; index < scenes.length; index += 1) {
    const previous = scenes[index - 1];
    const scene = scenes[index];
    const isConfiguredTransition = previous.id === cinematicConfig.transition.from && scene.id === cinematicConfig.transition.to;
    const overlapFrames = isConfiguredTransition
      ? Math.max(2, Math.round((previous.count - 1) * cinematicConfig.transition.overlapRatio[variant]))
      : 0;

    scene.playbackStart = previous.playbackStart + previous.count - overlapFrames;
    if (overlapFrames) {
      transitions.push({
        fromSceneIndex: index - 1,
        toSceneIndex: index,
        overlapFrames,
        start: scene.playbackStart,
        end: previous.playbackStart + previous.count - 1,
        scale: cinematicConfig.transition.scale,
        brightness: cinematicConfig.transition.brightness,
      });
    }
  }

  const playbackCount = scenes.at(-1).playbackStart + scenes.at(-1).count;
  return {
    variant,
    scenes,
    transitions,
    count: assetOffset,
    playbackCount,
    path(index) {
      const scene = scenes.find(candidate => index >= candidate.offset && index < candidate.offset + candidate.count);
      if (!scene) throw new RangeError(`Unknown frame: ${index}`);
      const localIndex = index - scene.offset + 1;
      return `./public/cinematic/smooth-v2/${scene.id}/${variant}/frame-${String(localIndex).padStart(4, '0')}.webp`;
    },
  };
}

export function frameAtProgress(progress, count) {
  return Math.round(clamp(progress, 0, 1) * (count - 1));
}

export function sceneAtFrame(timeline, index) {
  return timeline.scenes.findIndex(scene => index < scene.offset + scene.count);
}

export function advancePlayhead(current, target, elapsedMs) {
  // Wheel impulses get a short, refresh-rate-independent response. Anchor
  // jumps snap immediately instead of making the user wait for a long catch-up.
  if (current === null || elapsedMs > 160 || Math.abs(target - current) > 72) return target;
  if (Math.abs(target - current) < 0.015) return target;
  return current + (target - current) * (1 - Math.exp(-Math.min(elapsedMs, 50) / cinematicConfig.responseMs));
}

export function renderStateAtPosition(timeline, position) {
  const clampedPosition = clamp(position, 0, timeline.playbackCount - 1);
  const transition = timeline.transitions.find(candidate => clampedPosition >= candidate.start && clampedPosition <= candidate.end);

  if (transition) {
    const outgoing = timeline.scenes[transition.fromSceneIndex];
    const incoming = timeline.scenes[transition.toSceneIndex];
    const span = Math.max(1, transition.end - transition.start);
    const alpha = clamp((clampedPosition - transition.start) / span, 0, 1);
    return {
      position: clampedPosition,
      sceneIndex: alpha < 0.5 ? transition.fromSceneIndex : transition.toSceneIndex,
      transition: { ...transition, alpha },
      layers: [
        temporalLayer(outgoing, transition.fromSceneIndex, clampedPosition - outgoing.playbackStart, {
          opacity: 1 - alpha,
          scale: 1 + transition.scale * alpha,
          brightness: 1 - transition.brightness * alpha,
        }),
        temporalLayer(incoming, transition.toSceneIndex, clampedPosition - incoming.playbackStart, {
          opacity: alpha,
          scale: 1 + transition.scale * (1 - alpha),
          brightness: 1 - transition.brightness * (1 - alpha),
        }),
      ],
    };
  }

  const scene = [...timeline.scenes].reverse().find(candidate => clampedPosition >= candidate.playbackStart) || timeline.scenes[0];
  return {
    position: clampedPosition,
    sceneIndex: scene.sceneIndex,
    transition: null,
    layers: [temporalLayer(scene, scene.sceneIndex, clampedPosition - scene.playbackStart)],
  };
}

// Compatibility helper for callers that only need the primary temporal
// frame blend. Composite transitions use renderStateAtPosition().
export function blendAtFrame(timeline, position) {
  const layer = renderStateAtPosition(timeline, position).layers[0];
  return { from: layer.from, to: layer.to, alpha: layer.alpha };
}

