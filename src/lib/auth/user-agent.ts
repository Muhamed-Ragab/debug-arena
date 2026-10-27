export type DeviceType = "desktop" | "mobile" | "tablet";

export interface ParsedUserAgent {
  browser: string;
  device: string;
  deviceType: DeviceType;
  os: string;
}

function detectBrowser(ua: string): string {
  if (/Brave\//i.test(ua)) {
    return "Brave";
  }
  if (/Edg(?:e)?\//i.test(ua)) {
    return "Edge";
  }
  if (/OPR\/|Opera/i.test(ua)) {
    return "Opera";
  }
  if (/Chrome\/|CriOS\//i.test(ua)) {
    return "Chrome";
  }
  if (/Firefox\/|FxiOS\//i.test(ua)) {
    return "Firefox";
  }
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    return "Safari";
  }
  return "Unknown Browser";
}

function detectOS(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "iOS";
  }
  if (/Android/i.test(ua)) {
    return "Android";
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return "macOS";
  }
  if (/Windows NT|Windows/i.test(ua)) {
    return "Windows";
  }
  if (/Linux|X11/i.test(ua)) {
    return "Linux";
  }
  return "Unknown OS";
}

function detectDeviceType(ua: string): DeviceType {
  const isIPad = /iPad/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isAndroidTablet = isAndroid && !/Mobile/i.test(ua);

  if (isIPad || isAndroidTablet || /Tablet/i.test(ua)) {
    return "tablet";
  }
  if (/iPhone|iPod|Mobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function detectDeviceLabel(
  ua: string,
  os: string,
  deviceType: DeviceType
): string {
  if (/iPad/i.test(ua)) {
    return "iPad";
  }
  if (/iPhone|iPod/i.test(ua)) {
    return "iPhone";
  }
  if (/Android/i.test(ua)) {
    return deviceType === "tablet" ? "Android Tablet" : "Android Device";
  }
  if (os === "macOS") {
    return "MacBook / Mac";
  }
  if (os === "Windows") {
    return "Windows PC";
  }
  if (os === "Linux") {
    return "Linux PC";
  }
  if (deviceType === "mobile") {
    return "Mobile Device";
  }
  if (deviceType === "tablet") {
    return "Tablet Device";
  }
  return "Desktop PC";
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua || typeof ua !== "string") {
    return {
      browser: "Unknown Browser",
      device: "Unknown Device",
      deviceType: "desktop",
      os: "Unknown OS",
    };
  }

  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const deviceType = detectDeviceType(ua);
  const device = detectDeviceLabel(ua, os, deviceType);

  return {
    browser,
    device,
    deviceType,
    os,
  };
}

export function maskIpAddress(ip: string | null | undefined): string {
  if (!ip || typeof ip !== "string") {
    return "Unknown";
  }

  const trimmed = ip.trim();
  if (trimmed === "127.0.0.1" || trimmed === "localhost") {
    return "127.0.0.1 (Localhost)";
  }
  if (trimmed === "::1") {
    return "::1 (Localhost)";
  }

  // Handle IPv4-mapped IPv6, e.g. ::ffff:192.168.1.1
  const ipv4Mapped = trimmed.match(
    /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i
  );
  const normalizedIpv4 = ipv4Mapped ? ipv4Mapped[1] : trimmed;

  const ipv4Parts = normalizedIpv4.split(".");
  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every((part) => /^\d{1,3}$/.test(part))
  ) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.***`;
  }

  // IPv6
  if (trimmed.includes(":")) {
    const segments = trimmed.split(":");
    if (segments.length >= 3) {
      const prefix = segments.slice(0, 3).join(":");
      const maskedCount = segments.length - 3;
      const masked = Array.from({ length: maskedCount }, () => "****").join(
        ":"
      );
      return `${prefix}:${masked}`;
    }
    return `${trimmed.slice(0, 8)}:****`;
  }

  return trimmed;
}
