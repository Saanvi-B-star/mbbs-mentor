"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidProps {
  chart: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "base",
  themeVariables: {
    primaryColor: "#dbeafe",
    primaryTextColor: "#1e40af",
    primaryBorderColor: "#3b82f6",
    lineColor: "#64748b",
    secondaryColor: "#f1f5f9",
    tertiaryColor: "#ffffff",
  },
  securityLevel: "loose",
  fontFamily: "inherit",
});

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !chart) return;

      try {
        setError(null);
        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the chart
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError("Failed to render diagram. Please check the syntax.");
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-mono whitespace-pre-wrap">
        {error}
        <div className="mt-2 text-gray-500">{chart}</div>
      </div>
    );
  }

  if (!mounted) {
    return <div className="h-32 w-full animate-pulse bg-gray-50 rounded-xl my-4" />;
  }

  return (
    <div 
      ref={elementRef} 
      className="mermaid-container w-full flex justify-center bg-white p-4 rounded-xl border border-gray-100 my-4 overflow-x-auto shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Mermaid;
