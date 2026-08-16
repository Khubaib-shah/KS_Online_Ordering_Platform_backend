import { sanitizeFilename, isAllowedImage } from "./upload.middleware";

describe("upload.middleware", () => {
  it("sanitizes unsafe upload names", () => {
    expect(sanitizeFilename("../../etc/passwd;rm -rf /")).toBe(
      "etc-passwd-rm-rf",
    );
  });

  it("accepts PNG signatures and rejects non-image MIME types", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52,
    ]);
    expect(isAllowedImage("image/png", png)).toBe(true);
    expect(isAllowedImage("text/plain", png)).toBe(false);
  });
});
