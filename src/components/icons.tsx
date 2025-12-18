import React from "react";

export const VSCodeIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M23.15 2.587l-2.46-.346c-1.127-.159-2.222.396-2.825 1.334L13.5 10.026 5.861 6.136a1.14 1.14 0 00-1.428.327L.141 11.23a.573.573 0 00.187.896l4.288 2.35-4.288 2.35a.573.573 0 00-.187.896l4.292 4.767c.368.41.977.525 1.428.327l7.639-3.89 4.365 6.452c.603.938 1.698 1.493 2.825 1.334l2.46-.346a.573.573 0 00.418-.756V3.343a.573.573 0 00-.418-.756zm-4.32 15.356l-4.217-6.233 4.217-6.233V17.943z" />
  </svg>
);
