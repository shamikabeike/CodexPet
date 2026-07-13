const BASE_PATH =
  "M 64 12 C 92 24 122 48 150 64 C 192 54 328 54 370 64 C 398 48 428 24 456 12 C 478 28 486 72 474 108 C 498 129 510 164 508 202 L 506 366 C 505 406 486 438 451 450 C 416 458 376 456 337 450 C 331 455 322 458 312 458 C 295 458 283 449 282 435 L 238 435 C 237 449 225 458 208 458 C 198 458 189 455 183 450 C 144 456 104 458 69 450 C 34 438 15 406 14 366 L 12 202 C 10 164 22 129 46 108 C 34 72 42 28 64 12 Z";

const TWITCH_LEFT_PATH =
  "M 56 8 C 88 20 120 48 150 64 C 192 54 328 54 370 64 C 401 49 431 28 463 17 C 480 34 487 74 474 108 C 498 129 510 164 508 202 L 506 366 C 505 406 486 438 451 450 C 416 458 376 456 337 450 C 331 455 322 458 312 458 C 295 458 283 449 282 435 L 238 435 C 237 449 225 458 208 458 C 198 458 189 455 183 450 C 144 456 104 458 69 450 C 34 438 15 406 14 366 L 12 202 C 10 164 22 129 46 108 C 31 67 37 24 56 8 Z";

const TWITCH_RIGHT_PATH =
  "M 68 17 C 92 28 121 49 150 64 C 192 54 328 54 370 64 C 400 48 432 20 464 8 C 483 24 489 67 474 108 C 498 129 510 164 508 202 L 506 366 C 505 406 486 438 451 450 C 416 458 376 456 337 450 C 331 455 322 458 312 458 C 295 458 283 449 282 435 L 238 435 C 237 449 225 458 208 458 C 198 458 189 455 183 450 C 144 456 104 458 69 450 C 34 438 15 406 14 366 L 12 202 C 10 164 22 129 46 108 C 33 74 40 34 68 17 Z";

function TwitchAnimation() {
  return (
    <animate
      attributeName="d"
      dur="520ms"
      values={`${BASE_PATH};${TWITCH_LEFT_PATH};${TWITCH_RIGHT_PATH};${BASE_PATH}`}
      keyTimes="0;0.36;0.68;1"
      calcMode="spline"
      keySplines="0.3 0.8 0.3 1;0.3 0.8 0.3 1;0.3 0.8 0.3 1"
    />
  );
}

export function CatOutline({ twitch }: { twitch: boolean }) {
  return (
    <svg
      className="cat-outline"
      viewBox="0 0 520 460"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cat-surface-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#062522" />
          <stop offset="0.55" stopColor="#031d1b" />
          <stop offset="1" stopColor="#021614" />
        </linearGradient>
        <radialGradient id="cat-face-glow" cx="50%" cy="25%" r="54%">
          <stop offset="0" stopColor="#164c43" stopOpacity="0.38" />
          <stop offset="1" stopColor="#031a18" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="cat-outline-halo" d={BASE_PATH}>
        {twitch ? <TwitchAnimation /> : null}
      </path>
      <path
        className="cat-outline-path"
        d={BASE_PATH}
        fill="url(#cat-surface-gradient)"
      >
        {twitch ? <TwitchAnimation /> : null}
      </path>
      <path className="cat-outline-glow" d={BASE_PATH} fill="url(#cat-face-glow)" />
      <path
        className="inner-ear inner-ear-left"
        d="M 51 98 C 45 68 49 35 65 23 C 86 37 108 54 129 67 C 100 61 76 72 51 98 Z"
      />
      <path
        className="inner-ear inner-ear-right"
        d="M 469 98 C 475 68 471 35 455 23 C 434 37 412 54 391 67 C 420 61 444 72 469 98 Z"
      />
    </svg>
  );
}
