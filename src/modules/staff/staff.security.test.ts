import { canMutateStaffRole, STAFF_ROLE_ORDER } from "./staff.security";

describe("staff.security", () => {
  it("prevents a manager from elevating a staff member above their rank", () => {
    const result = canMutateStaffRole(
      { isOwner: false, role: { name: "Manager" } },
      { isOwner: false, role: { name: "Staff" } },
      "Manager",
    );

    expect(result).toBe(false);
  });

  it("allows an owner to assign any lower role", () => {
    const result = canMutateStaffRole(
      { isOwner: true, role: { name: "Owner" } },
      { isOwner: false, role: { name: "Manager" } },
      "Staff",
    );

    expect(result).toBe(true);
  });

  it("blocks self-escalation to a higher role", () => {
    const result = canMutateStaffRole(
      { isOwner: false, role: { name: "Staff" } },
      { isOwner: false, role: { name: "Manager" } },
      "Manager",
    );

    expect(result).toBe(false);
  });

  it("has the expected hierarchy order", () => {
    expect(STAFF_ROLE_ORDER.Owner).toBeGreaterThan(STAFF_ROLE_ORDER.Manager);
    expect(STAFF_ROLE_ORDER.Manager).toBeGreaterThan(STAFF_ROLE_ORDER.Staff);
  });
});
