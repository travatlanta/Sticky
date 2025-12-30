"use client";

const CART_SESSION_KEY = "cart-session-id";

export function getCartSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function setCartSessionId(sessionId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
}

export function clearCartSessionId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CART_SESSION_KEY);
  }
}
