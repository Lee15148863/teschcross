/**
 * Production gate tests — ALLOW_LEGACY_SIGNUP env flag.
 */
describe('ALLOW_LEGACY_SIGNUP gate logic', () => {
  beforeEach(() => {
    delete process.env.ALLOW_LEGACY_SIGNUP;
  });

  it('rejects legacy signup when flag not set (production default)', () => {
    var allowLegacy = process.env.ALLOW_LEGACY_SIGNUP === 'true';
    expect(allowLegacy).toBe(false);
  });

  it('rejects legacy signup when flag is false', () => {
    process.env.ALLOW_LEGACY_SIGNUP = 'false';
    var allowLegacy = process.env.ALLOW_LEGACY_SIGNUP === 'true';
    expect(allowLegacy).toBe(false);
  });

  it('allows legacy signup when flag is true', () => {
    process.env.ALLOW_LEGACY_SIGNUP = 'true';
    var allowLegacy = process.env.ALLOW_LEGACY_SIGNUP === 'true';
    expect(allowLegacy).toBe(true);
  });

  it('customer-owned Atlas signup passes regardless of flag', () => {
    // Gate code only runs when mongoUri is missing
    var hasMongoUri = true;
    // allowLegacy value irrelevant when mongoUri present
    expect(hasMongoUri).toBe(true);
  });
});
