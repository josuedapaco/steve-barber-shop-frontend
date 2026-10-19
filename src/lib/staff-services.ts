export type StaffServices = { staffId: string; serviceIds: string[] };
export type TeamMember = StaffServices & { id: string; name: string; image: string; initials: string; role: string; specialty: "barber" };
