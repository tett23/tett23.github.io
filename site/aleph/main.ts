// The Aleph page: the carousel of the four screens (ADR 0002).

import { mountCarousel } from "../lib/carousel.ts";

const carousel = document.querySelector<HTMLElement>("[data-carousel]");
if (carousel) mountCarousel(carousel);
