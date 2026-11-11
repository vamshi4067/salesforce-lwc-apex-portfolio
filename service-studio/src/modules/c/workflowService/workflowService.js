// Public demo adapter. No Salesforce calls or credentials; all records are fictional.
export const services = [
  {
    id: "repair",
    name: "Heating repair",
    description: "Diagnose a heating fault and get the system running.",
  },
  {
    id: "install",
    name: "Installation survey",
    description: "Assess a property before a heat-pump installation.",
  },
  {
    id: "maintenance",
    name: "Annual maintenance",
    description: "A scheduled inspection to keep equipment in good order.",
  },
];
const technicians = [
  {
    id: "alex",
    name: "Alex Morgan",
    initials: "AM",
    skills: ["repair", "maintenance"],
    specialty: "Heating & diagnostics",
  },
  {
    id: "sam",
    name: "Sam Rivera",
    initials: "SR",
    skills: ["install", "maintenance"],
    specialty: "Installation & commissioning",
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    initials: "JL",
    skills: ["repair", "install"],
    specialty: "Heat-pump specialist",
  },
];
const copy = (value) => JSON.parse(JSON.stringify(value));
const pause = () => new Promise((resolve) => setTimeout(resolve, 280));
let bookings = [];
let bookingSequence = 2100;
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function getDemoDays() {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const day = new Date(start);
    day.setDate(day.getDate() + i + 1);
    return {
      value: dateKey(day),
      weekday: day.toLocaleDateString("en-US", { weekday: "short" }),
      label: day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      full: day.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  });
}
export function getAvailability(service, date) {
  if (!services.some((s) => s.id === service))
    throw new Error("Choose a service type.");
  if (!getDemoDays().some((d) => d.value === date))
    throw new Error("Choose one of the next five available dates.");
  return technicians
    .filter((t) => t.skills.includes(service))
    .flatMap((t) =>
      [
        { hour: 9, label: "9:00–11:00 AM" },
        { hour: 11, label: "11:00 AM–1:00 PM" },
        { hour: 14, label: "2:00–4:00 PM" },
      ].map((time) => ({
        ...t,
        technicianId: t.id,
        id: `${date}-${t.id}-${time.hour}`,
        date,
        time: time.label,
        hour: time.hour,
      })),
    )
    .filter((slot) => !(slot.technicianId === "jordan" && slot.hour === 11))
    .filter(
      (slot) =>
        !bookings.some((b) => b.slotId === slot.id && b.status === "Confirmed"),
    )
    .map(copy);
}
export function getBookings() {
  return copy(bookings);
}
export async function bookAppointment(request) {
  const input = copy(request);
  await pause();
  const name = String(input.name || "").trim(),
    email = String(input.email || "").trim(),
    address = String(input.address || "").trim();
  if (name.length < 2 || name.length > 100)
    throw new Error("Enter a customer name between 2 and 100 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)
    throw new Error("Enter a valid email address.");
  if (address.length < 8 || address.length > 255)
    throw new Error("Enter a full service address (8–255 characters).");
  const slot = getAvailability(input.service, input.date).find(
    (s) => s.id === input.slotId,
  );
  if (!slot)
    throw new Error(
      "That appointment is no longer available. Choose another time.",
    );
  const booking = {
    id: `APT-${++bookingSequence}`,
    slotId: slot.id,
    date: input.date,
    service: input.service,
    serviceName: services.find((s) => s.id === input.service).name,
    technician: slot.name,
    time: slot.time,
    name,
    email,
    address,
    status: "Confirmed",
  };
  bookings = [...bookings, booking];
  return copy(booking);
}
export async function cancelAppointment(id) {
  await pause();
  const booking = bookings.find((b) => b.id === id);
  if (!booking || booking.status !== "Confirmed")
    throw new Error("This appointment is no longer active.");
  bookings = bookings.map((b) =>
    b.id === id ? { ...b, status: "Cancelled" } : b,
  );
  return getBookings();
}
export function resetWorkflows() {
  bookings = [];
}
