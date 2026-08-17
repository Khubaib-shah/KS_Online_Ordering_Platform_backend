import { canMutateStaffRole } from "./staff.security";

describe("staff.security", () => {
  it("prevents a manager from elevating a staff member above their rank", () => {
    const result = canMutateStaffRole(
      { isOwner: false, role: { rank: 2, name: "Manager" } },
      { isOwner: false, role: { rank: 1, name: "Staff" } },
      2,
    );

    expect(result).toBe(false);
  });

  it("allows an owner to assign any lower role", () => {
    const result = canMutateStaffRole(
      { isOwner: true, role: { rank: 3, name: "Owner" } },
      { isOwner: false, role: { rank: 2, name: "Manager" } },
      1,
    );

    expect(result).toBe(true);
  });

  it("blocks self-escalation to a higher role", () => {
    const result = canMutateStaffRole(
      { isOwner: false, role: { rank: 1, name: "Staff" } },
      { isOwner: false, role: { rank: 2, name: "Manager" } },
      2,
    );

    expect(result).toBe(false);
  });

  it("has the expected hierarchy order logic", () => {
    const result = canMutateStaffRole(
      { isOwner: false, role: { rank: 3, name: "Admin" } },
      { isOwner: false, role: { rank: 1, name: "Staff" } },
      2,
    );

    expect(result).toBe(true);
  });
});
