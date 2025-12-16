type Point = { x: number; y: number };

export function traceContour(
  imageData: ImageData,
  threshold: number = 10,
  simplifyTolerance: number = 2
): string {
  const { width, height, data } = imageData;
  
  const isOpaque = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * 4;
    return data[idx + 3] > threshold;
  };

  const findStartPoint = (): Point | null => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isOpaque(x, y)) {
          return { x, y };
        }
      }
    }
    return null;
  };

  const startPoint = findStartPoint();
  if (!startPoint) {
    return `M0,0 L${width},0 L${width},${height} L0,${height} Z`;
  }

  const points: Point[] = [];
  const directions = [
    { dx: 1, dy: 0 },  // right
    { dx: 1, dy: 1 },  // down-right
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 1 }, // down-left
    { dx: -1, dy: 0 }, // left
    { dx: -1, dy: -1 },// up-left
    { dx: 0, dy: -1 }, // up
    { dx: 1, dy: -1 }, // up-right
  ];

  let current = { ...startPoint };
  let prevDir = 0;
  const visited = new Set<string>();
  const maxIterations = width * height * 2;
  let iterations = 0;

  do {
    const key = `${current.x},${current.y}`;
    if (!visited.has(key)) {
      points.push({ ...current });
      visited.add(key);
    }

    let found = false;
    for (let i = 0; i < 8; i++) {
      const dirIdx = (prevDir + 5 + i) % 8;
      const dir = directions[dirIdx];
      const next = { x: current.x + dir.dx, y: current.y + dir.dy };

      if (isOpaque(next.x, next.y)) {
        let isEdge = false;
        for (const d of directions) {
          if (!isOpaque(next.x + d.dx, next.y + d.dy)) {
            isEdge = true;
            break;
          }
        }

        if (isEdge || next.x === startPoint.x && next.y === startPoint.y) {
          current = next;
          prevDir = dirIdx;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      for (let i = 0; i < 8; i++) {
        const dirIdx = (prevDir + 5 + i) % 8;
        const dir = directions[dirIdx];
        const next = { x: current.x + dir.dx, y: current.y + dir.dy };
        
        if (isOpaque(next.x, next.y) && !visited.has(`${next.x},${next.y}`)) {
          current = next;
          prevDir = dirIdx;
          found = true;
          break;
        }
      }
    }

    if (!found) break;
    iterations++;
  } while (
    (current.x !== startPoint.x || current.y !== startPoint.y) &&
    iterations < maxIterations
  );

  if (points.length < 3) {
    return `M0,0 L${width},0 L${width},${height} L0,${height} Z`;
  }

  const simplified = simplifyPath(points, simplifyTolerance);
  return pointsToSvgPath(simplified);
}

function simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPath(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const t = Math.max(0, Math.min(1, 
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq
  ));

  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.hypot(point.x - projX, point.y - projY);
}

function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return "";
  
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L${points[i].x},${points[i].y}`;
  }
  path += " Z";
  
  return path;
}

export function getContourFromImage(
  imageElement: HTMLImageElement,
  scale: number = 1,
  threshold: number = 10,
  simplifyTolerance: number = 2
): string {
  const canvas = document.createElement("canvas");
  const width = Math.floor(imageElement.naturalWidth * scale);
  const height = Math.floor(imageElement.naturalHeight * scale);
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  
  ctx.drawImage(imageElement, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  
  return traceContour(imageData, threshold, simplifyTolerance);
}

export function scaleContourPath(path: string, scaleX: number, scaleY: number): string {
  return path.replace(/([ML])\s*([\d.-]+)\s*,\s*([\d.-]+)/g, (_, cmd, x, y) => {
    const scaledX = parseFloat(x) * scaleX;
    const scaledY = parseFloat(y) * scaleY;
    return `${cmd}${scaledX.toFixed(2)},${scaledY.toFixed(2)}`;
  });
}

export function offsetContourPath(path: string, offsetX: number, offsetY: number): string {
  return path.replace(/([ML])\s*([\d.-]+)\s*,\s*([\d.-]+)/g, (_, cmd, x, y) => {
    const newX = parseFloat(x) + offsetX;
    const newY = parseFloat(y) + offsetY;
    return `${cmd}${newX.toFixed(2)},${newY.toFixed(2)}`;
  });
}

export function expandContour(path: string, amount: number): string {
  const points: Point[] = [];
  const regex = /([ML])\s*([\d.-]+)\s*,\s*([\d.-]+)/g;
  let match;
  
  while ((match = regex.exec(path)) !== null) {
    points.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
  }
  
  if (points.length < 3) return path;
  
  let cx = 0, cy = 0;
  points.forEach(p => { cx += p.x; cy += p.y; });
  cx /= points.length;
  cy /= points.length;
  
  const expandedPoints = points.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy);
    if (len === 0) return p;
    
    const scale = (len + amount) / len;
    return {
      x: cx + dx * scale,
      y: cy + dy * scale
    };
  });
  
  return pointsToSvgPath(expandedPoints);
}
