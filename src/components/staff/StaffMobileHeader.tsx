"use client";

export function StaffMobileHeader() {
  return (
    <div className="mb-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white shadow-sm lg:hidden">
      <h1 className="text-lg font-bold tracking-tight">Canteen counter</h1>
      <p className="mt-0.5 text-xs text-orange-100">
        Pickup queue · verify · inventory
      </p>
    </div>
  );
}
