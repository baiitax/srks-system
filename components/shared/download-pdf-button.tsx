"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateSecurePDF } from "@/lib/utils/pdf-generator";

interface DownloadPdfButtonProps {
  poData: any;
  docType: "PURCHASE_ORDER" | "COMPANY_WAYBILL";
  label?: string;
  className?: string;
}

export function DownloadPdfButton({ poData, docType, label, className }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateSecurePDF(poData, docType);
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate secure PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isGenerating}
      className={className || "w-full bg-teal-600 hover:bg-teal-700 text-white"}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {label || "Download Secured PDF"}
    </Button>
  );
}