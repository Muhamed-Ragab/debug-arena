import { describe, expect, it } from "vitest";
import { maskIpAddress, parseUserAgent } from "./user-agent";

describe("parseUserAgent", () => {
  it("handles null, undefined, and empty string safely", () => {
    const defaultResult = {
      browser: "Unknown Browser",
      device: "Unknown Device",
      deviceType: "desktop",
      os: "Unknown OS",
    };
    expect(parseUserAgent(null)).toEqual(defaultResult);
    expect(parseUserAgent(undefined)).toEqual(defaultResult);
    expect(parseUserAgent("")).toEqual(defaultResult);
  });

  it("identifies Chrome on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Chrome",
      device: "MacBook / Mac",
      deviceType: "desktop",
      os: "macOS",
    });
  });

  it("identifies Safari on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Safari",
      device: "MacBook / Mac",
      deviceType: "desktop",
      os: "macOS",
    });
  });

  it("identifies Edge on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.92";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Edge",
      device: "Windows PC",
      deviceType: "desktop",
      os: "Windows",
    });
  });

  it("identifies Brave browser on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Brave/122.0.0.0";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Brave",
      device: "Windows PC",
      deviceType: "desktop",
      os: "Windows",
    });
  });

  it("identifies Opera browser on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Opera",
      device: "Windows PC",
      deviceType: "desktop",
      os: "Windows",
    });
  });

  it("identifies Firefox on Linux", () => {
    const ua =
      "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Firefox",
      device: "Linux PC",
      deviceType: "desktop",
      os: "Linux",
    });
  });

  it("identifies Safari on iPhone (mobile)", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Safari",
      device: "iPhone",
      deviceType: "mobile",
      os: "iOS",
    });
  });

  it("identifies Chrome on Android (mobile)", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Mobile Safari/537.36";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Chrome",
      device: "Android Device",
      deviceType: "mobile",
      os: "Android",
    });
  });

  it("identifies iPad as tablet", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Safari",
      device: "iPad",
      deviceType: "tablet",
      os: "iOS",
    });
  });

  it("identifies Android tablet", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Safari/537.36";
    expect(parseUserAgent(ua)).toEqual({
      browser: "Chrome",
      device: "Android Tablet",
      deviceType: "tablet",
      os: "Android",
    });
  });
});

describe("maskIpAddress", () => {
  it("handles null, undefined, and empty string", () => {
    expect(maskIpAddress(null)).toBe("Unknown");
    expect(maskIpAddress(undefined)).toBe("Unknown");
    expect(maskIpAddress("")).toBe("Unknown");
  });

  it("handles localhost IPv4 and IPv6", () => {
    expect(maskIpAddress("127.0.0.1")).toBe("127.0.0.1 (Localhost)");
    expect(maskIpAddress("::1")).toBe("::1 (Localhost)");
    expect(maskIpAddress("localhost")).toBe("127.0.0.1 (Localhost)");
  });

  it("masks the host octet of IPv4 addresses", () => {
    expect(maskIpAddress("192.168.1.45")).toBe("192.168.1.***");
    expect(maskIpAddress("10.0.0.1")).toBe("10.0.0.***");
    expect(maskIpAddress("172.16.254.1")).toBe("172.16.254.***");
  });

  it("masks IPv4-mapped IPv6 addresses", () => {
    expect(maskIpAddress("::ffff:192.168.1.45")).toBe("192.168.1.***");
  });

  it("masks IPv6 addresses preserving prefix", () => {
    expect(maskIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      "2001:0db8:85a3:****:****:****:****:****"
    );
  });
});
