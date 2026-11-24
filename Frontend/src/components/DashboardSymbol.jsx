export default function DashboardSymbol({ name }) {
  const shapes = {
    oil: (
      <>
        <path d="M8 19h8l9-7h11v7h8l9-7 4 4-12 16H23L8 23zM25 8h13M31 8v4" />
        <path d="M54 29s-4 5-4 8a4 4 0 0 0 8 0c0-3-4-8-4-8z" />
      </>
    ),
    temperature: (
      <>
        <path d="M28 28V9a4 4 0 0 1 8 0v19a8 8 0 1 1-8 0zM32 17v17M38 12h7M38 20h7M7 41q6-6 12 0t12 0t12 0t12 0" />
      </>
    ),
    brake: (
      <>
        <circle cx="32" cy="24" r="15" />
        <path d="M11 10a25 25 0 0 0 0 28M53 10a25 25 0 0 1 0 28M32 14v13" />
        <circle cx="32" cy="33" r="1" fill="currentColor" />
      </>
    ),
    battery: (
      <>
        <rect x="9" y="13" width="46" height="28" rx="3" />
        <path d="M16 13V8h10v5M39 13V8h9v5M16 27h10M38 27h10M43 22v10" />
      </>
    ),
    engine: (
      <path d="M8 20h8l7-8h19v7h8l5-5h4v24h-5l-5-5h-6l-4 7H20l-5-8H8zM25 7h13M31 7v5M3 20v14M3 27h5" />
    ),
    abs: (
      <>
        <circle cx="32" cy="24" r="18" />
        <path d="M8 10a28 28 0 0 0 0 28M56 10a28 28 0 0 1 0 28" />
        <text
          x="32"
          y="29"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
        >
          ABS
        </text>
      </>
    ),
    tire: (
      <>
        <path d="M16 9C10 16 7 28 10 39h44c3-11 0-23-6-30M16 39v4M24 39v4M32 39v4M40 39v4M48 39v4M32 13v14" />
        <circle cx="32" cy="33" r="1" fill="currentColor" />
      </>
    ),
    airbag: (
      <>
        <circle cx="22" cy="10" r="5" />
        <path d="m18 20 9 8-7 13M16 18l-3 15h13M29 27l9 13" />
        <circle cx="44" cy="19" r="10" />
      </>
    ),
    belt: (
      <>
        <circle cx="32" cy="8" r="5" />
        <path d="m20 43 2-21q10-9 20 0l2 21M22 29l20 10M20 43l27-25" />
      </>
    ),
    highbeam: (
      <>
        <path d="M37 9v30q20 0 20-15T37 9zM7 9h22M7 19h22M7 29h22M7 39h22" />
      </>
    ),
  };
  return (
    <svg
      width="64"
      height="48"
      viewBox="0 0 64 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}
