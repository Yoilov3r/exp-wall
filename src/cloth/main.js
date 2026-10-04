import { gsap } from "gsap";
import "./styles.css";

const CONFIG = {
  targetCellWidth: 92,
  targetCellHeight: 84,
  minCols: 14,
  maxCols: 22,
  minRows: 9,
  maxRows: 14,
  restStiffness: 37,
  restZStiffness: 108,
  neighborStiffness: 94,
  dampingX: 3.2,
  dampingZ: 4.4,
  edgeBoost: 0.7,
  pointerRadius: 225,
  pointerDepth: 118,
  pointerPull: 168,
  pointerZStiffness: 188,
  pointerZDamping: 10,
  pointerDrag: 0.24,
  rippleStrength: 26,
  depthProjection: 0.00125,
  maxVelocity: 980,
  sleepEnergy: 0.0011,
};

const template = document.querySelector("#page-template");
const source = document.querySelector("#page-source");
const clothRoot = document.querySelector("#cloth-root");
const interactionLayer = document.querySelector("#interaction-layer");
const cursor = document.querySelector("#cloth-cursor");
const shutter = document.querySelector("#startup-shutter");

if (!template || !source || !clothRoot || !interactionLayer || !cursor || !shutter) {
  throw new Error("Cloth surface markup is incomplete.");
}

source.append(template.content.firstElementChild.cloneNode(true));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointer = {
  x: window.innerWidth * 0.56,
  y: window.innerHeight * 0.45,
  previousX: window.innerWidth * 0.56,
  previousY: window.innerHeight * 0.45,
  velocityX: 0,
  velocityY: 0,
  speed: 0,
  pressure: 0,
  impulse: 0,
  active: false,
  holdUntil: 0,
  lastEventTime: performance.now(),
};

let mesh = null;
let resizeTimer = 0;
let quickCursorX = null;
let quickCursorY = null;
let isStarted = false;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function canRunMesh() {
  return (
    !reducedMotion.matches &&
    window.innerWidth >= 900 &&
    window.innerHeight >= 620
  );
}

function gridForViewport(width, height) {
  const cols = clamp(
    Math.round(width / CONFIG.targetCellWidth),
    CONFIG.minCols,
    CONFIG.maxCols,
  );
  const rows = clamp(
    Math.round(height / CONFIG.targetCellHeight),
    CONFIG.minRows,
    CONFIG.maxRows,
  );

  return { cols, rows };
}

function createNode(index, col, row, x, y, width, height) {
  const edgeX = Math.min(col, width - col) / width;
  const edgeY = Math.min(row, height - row) / height;
  const edge = 1 - Math.min(edgeX, edgeY, 0.5) * 2;

  return {
    index,
    col,
    row,
    restX: x,
    restY: y,
    x,
    y,
    z: 0,
    projectedX: x,
    projectedY: y,
    previousX: x,
    previousY: y,
    previousZ: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    accelerationX: 0,
    accelerationY: 0,
    accelerationZ: 0,
    edgeBoost: edge * CONFIG.edgeBoost,
  };
}

function rebuildMesh() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { cols, rows } = gridForViewport(width, height);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const nodes = new Array((cols + 1) * (rows + 1));
  const cells = [];
  const fragment = document.createDocumentFragment();

  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const index = row * (cols + 1) + col;
      nodes[index] = createNode(
        index,
        col,
        row,
        col * cellWidth,
        row * cellHeight,
        cols,
        rows,
      );
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const topLeftIndex = row * (cols + 1) + col;
      const topRightIndex = topLeftIndex + 1;
      const bottomLeftIndex = (row + 1) * (cols + 1) + col;
      const bottomRightIndex = bottomLeftIndex + 1;
      const baseX = nodes[topLeftIndex].restX;
      const baseY = nodes[topLeftIndex].restY;
      const baseWidth = nodes[topRightIndex].restX - baseX;
      const baseHeight = nodes[bottomLeftIndex].restY - baseY;
      const cell = document.createElement("div");
      const clone = template.content.firstElementChild.cloneNode(true);

      cell.className = "cloth-cell";
      cell.style.width = `${baseWidth + 0.75}px`;
      cell.style.height = `${baseHeight + 0.75}px`;

      clone.classList.add("page-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      clone.style.transform = `translate3d(${-baseX}px, ${-baseY}px, 0)`;

      cell.append(clone);
      fragment.append(cell);
      cells.push({
        element: cell,
        topLeftIndex,
        topRightIndex,
        bottomRightIndex,
        bottomLeftIndex,
        baseX,
        baseY,
        baseWidth,
        baseHeight,
        lastMatrix: "",
        lastShade: -1,
      });
    }
  }

  clothRoot.replaceChildren(fragment);
  document.querySelectorAll(".mesh-readout").forEach((element) => {
    element.textContent = `${cols} × ${rows}`;
  });

  mesh = {
    width,
    height,
    cols,
    rows,
    cellWidth,
    cellHeight,
    nodes,
    cells,
    awake: true,
    stableFrames: 0,
    simulationTime: 0,
    rightRest: cellWidth,
    downRest: cellHeight,
  };

  renderField();
}

function addNeighborSpring(first, second, restLength) {
  const deltaX = second.x - first.x;
  const deltaY = second.y - first.y;
  const deltaZ = second.z - first.z;
  const lengthSquared =
    deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;

  if (lengthSquared < 0.0001) {
    return;
  }

  const length = Math.sqrt(lengthSquared);
  const force =
    (CONFIG.neighborStiffness * (length - restLength)) / length;
  const forceX = deltaX * force;
  const forceY = deltaY * force;
  const forceZ = deltaZ * force;

  first.accelerationX += forceX;
  first.accelerationY += forceY;
  first.accelerationZ += forceZ;
  second.accelerationX -= forceX;
  second.accelerationY -= forceY;
  second.accelerationZ -= forceZ;
}

function applyPointerForce(node, pressure) {
  const deltaX = node.restX - pointer.x;
  const deltaY = node.restY - pointer.y;
  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  const radiusSquared = CONFIG.pointerRadius * CONFIG.pointerRadius;

  if (distanceSquared >= radiusSquared) {
    return;
  }

  const distance = Math.sqrt(distanceSquared) || 1;
  const falloff = 1 - distance / CONFIG.pointerRadius;
  const bell = falloff * falloff * (3 - 2 * falloff);
  const radialX = -deltaX / distance;
  const radialY = -deltaY / distance;
  const velocityFactor = clamp(pointer.speed / 720, 0, 1);
  const localPressure = pressure * bell;

  node.accelerationX +=
    radialX * CONFIG.pointerPull * localPressure +
    pointer.velocityX * CONFIG.pointerDrag * localPressure;
  node.accelerationY +=
    radialY * CONFIG.pointerPull * localPressure +
    pointer.velocityY * CONFIG.pointerDrag * localPressure;

  const targetDepth = -CONFIG.pointerDepth * localPressure;
  const ripple =
    Math.sin(distance * 0.076 - mesh.simulationTime * 18.5) *
    CONFIG.rippleStrength *
    localPressure *
    velocityFactor;

  node.accelerationZ +=
    (targetDepth - node.z) * CONFIG.pointerZStiffness +
    ripple -
    node.velocityZ * CONFIG.pointerZDamping;
}

function integrateNode(node, delta) {
  const anchor = CONFIG.restStiffness * (1 + node.edgeBoost);

  node.accelerationX -= (node.x - node.restX) * anchor;
  node.accelerationY -= (node.y - node.restY) * anchor;
  node.accelerationZ -= node.z * CONFIG.restZStiffness;

  node.velocityX += node.accelerationX * delta;
  node.velocityY += node.accelerationY * delta;
  node.velocityZ += node.accelerationZ * delta;

  const dampingX = Math.exp(-CONFIG.dampingX * delta);
  const dampingZ = Math.exp(-CONFIG.dampingZ * delta);
  node.velocityX *= dampingX;
  node.velocityY *= dampingX;
  node.velocityZ *= dampingZ;

  node.velocityX = clamp(node.velocityX, -CONFIG.maxVelocity, CONFIG.maxVelocity);
  node.velocityY = clamp(node.velocityY, -CONFIG.maxVelocity, CONFIG.maxVelocity);
  node.velocityZ = clamp(node.velocityZ, -CONFIG.maxVelocity, CONFIG.maxVelocity);

  node.previousX = node.x;
  node.previousY = node.y;
  node.previousZ = node.z;
  node.x += node.velocityX * delta;
  node.y += node.velocityY * delta;
  node.z += node.velocityZ * delta;
}

function simulateStep(delta) {
  for (const node of mesh.nodes) {
    node.accelerationX = 0;
    node.accelerationY = 0;
    node.accelerationZ = 0;
  }

  for (let row = 0; row <= mesh.rows; row += 1) {
    for (let col = 0; col <= mesh.cols; col += 1) {
      const index = row * (mesh.cols + 1) + col;
      const node = mesh.nodes[index];

      if (col < mesh.cols) {
        addNeighborSpring(node, mesh.nodes[index + 1], mesh.rightRest);
      }

      if (row < mesh.rows) {
        addNeighborSpring(
          node,
          mesh.nodes[index + mesh.cols + 1],
          mesh.downRest,
        );
      }
    }
  }

  const active =
    pointer.active || performance.now() < pointer.holdUntil ? 1 : 0;
  const pressure = clamp(pointer.pressure + pointer.impulse * 0.72, 0, 1.22);

  for (const node of mesh.nodes) {
    if (active || pressure > 0.002) {
      applyPointerForce(node, pressure);
    }

    integrateNode(node, delta);
  }
}

function updatePhysics(frameDelta) {
  const active =
    pointer.active || performance.now() < pointer.holdUntil ? 1 : 0;
  const pressureEase = 1 - Math.exp(-(active ? 11 : 5.2) * frameDelta);

  pointer.pressure += (active - pointer.pressure) * pressureEase;
  pointer.impulse *= Math.exp(-4.8 * frameDelta);
  pointer.speed *= Math.exp(-4.2 * frameDelta);
  pointer.velocityX *= Math.exp(-4.8 * frameDelta);
  pointer.velocityY *= Math.exp(-4.8 * frameDelta);

  const steps = clamp(Math.ceil(frameDelta / (1 / 120)), 1, 3);
  const stepDelta = frameDelta / steps;

  for (let step = 0; step < steps; step += 1) {
    simulateStep(stepDelta);
    mesh.simulationTime += stepDelta;
  }
}

function updateProjection() {
  for (const node of mesh.nodes) {
    const depth = clamp(node.z, -155, 78);
    const perspective = depth * CONFIG.depthProjection;

    node.projectedX =
      node.x + (node.restX - pointer.x) * perspective;
    node.projectedY =
      node.y + (node.restY - pointer.y) * perspective;
  }
}

function quadMatrix(width, height, points) {
  const [point0, point1, point2, point3] = points;
  const dx1 = point1.x - point2.x;
  const dx2 = point3.x - point2.x;
  const dx3 = point0.x - point1.x + point2.x - point3.x;
  const dy1 = point1.y - point2.y;
  const dy2 = point3.y - point2.y;
  const dy3 = point0.y - point1.y + point2.y - point3.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  let projectionX = 0;
  let projectionY = 0;

  if (
    (Math.abs(dx3) > 0.0001 || Math.abs(dy3) > 0.0001) &&
    Math.abs(determinant) > 0.0001
  ) {
    projectionX = (dx3 * dy2 - dx2 * dy3) / determinant;
    projectionY = (dx1 * dy3 - dx3 * dy1) / determinant;
  }

  const a = point1.x - point0.x + projectionX * point1.x;
  const b = point3.x - point0.x + projectionY * point3.x;
  const c = point0.x;
  const d = point1.y - point0.y + projectionX * point1.y;
  const e = point3.y - point0.y + projectionY * point3.y;
  const f = point0.y;
  const safe = (value) => (Number.isFinite(value) ? value.toFixed(3) : "0");

  return `matrix3d(${safe(a / width)}, ${safe(d / width)}, 0, ${safe(
    projectionX / width,
  )}, ${safe(b / height)}, ${safe(e / height)}, 0, ${safe(
    projectionY / height,
  )}, 0, 0, 1, 0, ${safe(c)}, ${safe(f)}, 0, 1)`;
}

function renderField() {
  if (!mesh) {
    return;
  }

  for (const cell of mesh.cells) {
    const topLeft = mesh.nodes[cell.topLeftIndex];
    const topRight = mesh.nodes[cell.topRightIndex];
    const bottomRight = mesh.nodes[cell.bottomRightIndex];
    const bottomLeft = mesh.nodes[cell.bottomLeftIndex];
    const points = [
      {
        x: topLeft.projectedX,
        y: topLeft.projectedY,
      },
      {
        x: topRight.projectedX,
        y: topRight.projectedY,
      },
      {
        x: bottomRight.projectedX,
        y: bottomRight.projectedY,
      },
      {
        x: bottomLeft.projectedX,
        y: bottomLeft.projectedY,
      },
    ];
    const matrix = quadMatrix(cell.baseWidth, cell.baseHeight, points);

    if (matrix !== cell.lastMatrix) {
      cell.element.style.transform = matrix;
      cell.lastMatrix = matrix;
    }

    const averageDepth =
      (topLeft.z + topRight.z + bottomRight.z + bottomLeft.z) * 0.25;
    const shade = clamp(-averageDepth / CONFIG.pointerDepth, 0, 1) * 0.16;

    if (Math.abs(shade - cell.lastShade) > 0.004) {
      cell.element.style.setProperty("--shade", shade.toFixed(3));
      cell.lastShade = shade;
    }
  }
}

function maximumMotion() {
  let energy = 0;

  for (const node of mesh.nodes) {
    energy = Math.max(
      energy,
      node.velocityX * node.velocityX +
        node.velocityY * node.velocityY +
        node.velocityZ * node.velocityZ,
    );
  }

  return energy;
}

function simulationTick(_time, deltaTime) {
  if (!mesh || !mesh.awake) {
    return;
  }

  const frameDelta = clamp(deltaTime / 1000, 1 / 240, 1 / 30);
  const active =
    pointer.active || performance.now() < pointer.holdUntil ? 1 : 0;

  updatePhysics(frameDelta);
  updateProjection();
  renderField();

  const quiet =
    !active &&
    pointer.pressure < 0.004 &&
    pointer.impulse < 0.004 &&
    maximumMotion() < CONFIG.sleepEnergy;

  mesh.stableFrames = quiet ? mesh.stableFrames + 1 : 0;

  if (mesh.stableFrames > 36) {
    mesh.awake = false;
  }
}

function wakeSurface() {
  if (!mesh) {
    return;
  }

  mesh.awake = true;
  mesh.stableFrames = 0;
}

function pulseAt(x, y, strength = 1, holdDuration = 160) {
  const now = performance.now();
  pointer.x = x;
  pointer.y = y;
  pointer.previousX = x;
  pointer.previousY = y;
  pointer.impulse = Math.max(pointer.impulse, strength);
  pointer.holdUntil = Math.max(pointer.holdUntil, now + holdDuration);
  wakeSurface();
}

function onPointerMove(event) {
  const now = performance.now();
  const elapsed = clamp((now - pointer.lastEventTime) / 1000, 0.008, 0.1);
  const deltaX = event.clientX - pointer.x;
  const deltaY = event.clientY - pointer.y;

  pointer.previousX = pointer.x;
  pointer.previousY = pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.velocityX = deltaX / elapsed;
  pointer.velocityY = deltaY / elapsed;
  pointer.speed = Math.hypot(pointer.velocityX, pointer.velocityY);
  pointer.lastEventTime = now;
  pointer.active = true;

  if (quickCursorX && quickCursorY) {
    quickCursorX(pointer.x);
    quickCursorY(pointer.y);
  }

  wakeSurface();
}

function onPointerDown(event) {
  pulseAt(event.clientX, event.clientY, 1.15, 240);
  gsap.fromTo(
    cursor,
    { scale: 0.74 },
    { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" },
  );
}

function releasePointer() {
  pointer.active = false;
  pointer.holdUntil = 0;
  wakeSurface();
}

function resetSurface() {
  if (!mesh) {
    return;
  }

  for (const node of mesh.nodes) {
    node.x = node.restX;
    node.y = node.restY;
    node.z = 0;
    node.previousX = node.restX;
    node.previousY = node.restY;
    node.previousZ = 0;
    node.velocityX = 0;
    node.velocityY = 0;
    node.velocityZ = 0;
  }

  mesh.stableFrames = 0;
  pointer.pressure = 0;
  pointer.impulse = 0;
  pulseAt(mesh.width * 0.55, mesh.height * 0.48, 0.62, 110);
}

function onResize() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (!canRunMesh()) {
      window.location.reload();
      return;
    }

    pointer.x = clamp(pointer.x, 0, window.innerWidth);
    pointer.y = clamp(pointer.y, 0, window.innerHeight);
    rebuildMesh();
    wakeSurface();
  }, 180);
}

function bindInteractions() {
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) {
      releasePointer();
    }
  });
  window.addEventListener("blur", releasePointer);
  window.addEventListener("resize", onResize, { passive: true });

  interactionLayer.querySelectorAll(".interactive-zone").forEach((zone) => {
    const hoverName = zone.dataset.hover;

    zone.addEventListener("pointerenter", () => {
      clothRoot.dataset.hover = hoverName;
    });
    zone.addEventListener("pointerleave", () => {
      if (clothRoot.dataset.hover === hoverName) {
        delete clothRoot.dataset.hover;
      }
    });
    zone.addEventListener("click", () => {
      const rect = zone.getBoundingClientRect();
      const strength = Number(zone.dataset.pulse || 0.6);

      if (hoverName === "brand") {
        resetSurface();
      } else {
        pulseAt(
          rect.left + rect.width * 0.5,
          rect.top + rect.height * 0.5,
          strength,
          190,
        );
      }
    });
  });

  window.addEventListener("keydown", (event) => {
    if (
      event.key.toLowerCase() === "r" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      resetSurface();
    }
  });
}

function start() {
  if (!canRunMesh()) {
    document.body.classList.add("static-mode");
    return;
  }

  document.body.classList.add("cloth-mode");
  rebuildMesh();
  bindInteractions();

  quickCursorX = gsap.quickTo(cursor, "x", {
    duration: 0.18,
    ease: "power3.out",
  });
  quickCursorY = gsap.quickTo(cursor, "y", {
    duration: 0.18,
    ease: "power3.out",
  });
  gsap.set(cursor, { x: pointer.x, y: pointer.y });
  gsap.set([clothRoot, interactionLayer], { autoAlpha: 0 });
  gsap.set(cursor, { autoAlpha: 0, scale: 0.72 });
  gsap.set(shutter, { transformOrigin: "50% 100%", scaleY: 1 });

  const intro = gsap.timeline({
    defaults: { ease: "power3.out" },
  });

  intro
    .to(shutter, {
      scaleY: 0,
      duration: 1.05,
      ease: "power4.inOut",
    })
    .to(
      clothRoot,
      {
        autoAlpha: 1,
        duration: 0.8,
      },
      0.18,
    )
    .to(
      interactionLayer,
      {
        autoAlpha: 1,
        duration: 0.5,
      },
      0.55,
    )
    .to(
      cursor,
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.55,
      },
      0.62,
    )
    .add(() => {
      pulseAt(window.innerWidth * 0.56, window.innerHeight * 0.46, 0.88, 220);
    }, 0.72);

  gsap.ticker.add(simulationTick);
  isStarted = true;

  window.__CLOTH_SURFACE__ = {
    get mesh() {
      return mesh;
    },
    get pointer() {
      return pointer;
    },
    pulseAt,
    resetSurface,
  };
}

if (!isStarted) {
  start();
}

reducedMotion.addEventListener("change", () => window.location.reload());
