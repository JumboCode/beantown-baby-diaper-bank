"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        background: "white",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <SwaggerUI url="/openapi.yaml" />
    </div>
  );
}
