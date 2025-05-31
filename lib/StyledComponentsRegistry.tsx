"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only executed on client-side and server-side, but not during build time.
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    // Clear the styles as they are injected.
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  // If rendering on the client, just return children.
  // This avoids wrapping <StyleSheetManager> on the client,
  // which can cause issues with styles not updating correctly.
  if (typeof window !== "undefined") {
    return <>{children}</>;
  }

  // If rendering on the server, wrap with StyleSheetManager.
  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
