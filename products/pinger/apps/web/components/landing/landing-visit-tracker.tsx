"use client";

import { useEffect } from "react";

const STORAGE_KEY = "pinger.visit_landing.tracked";

function readUtm(search: URLSearchParams) {
  return {
    source: search.get("utm_source"),
    medium: search.get("utm_medium"),
    campaign: search.get("utm_campaign"),
    content: search.get("utm_content"),
    term: search.get("utm_term"),
  };
}

export function LandingVisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const payload = {
      path: window.location.pathname,
      referrer: document.referrer || null,
      utm: readUtm(new URLSearchParams(window.location.search)),
    };

    fetch("/api/funnel/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then(() => {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      })
      .catch(() => {
        // Best-effort analytics; ignore failures.
      });
  }, []);

  return null;
}
