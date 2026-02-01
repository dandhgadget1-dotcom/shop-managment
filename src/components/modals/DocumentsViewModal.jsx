"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IdCard, User, UserPlus, Download, ZoomIn, ZoomOut, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DocumentsViewModal({ open, onOpenChange, customer }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(1);

  if (!customer) return null;

  const documents = [
    {
      title: "Customer ID - Front",
      image: customer.idFront || customer.idFrontPreview,
      icon: <IdCard className="h-5 w-5" />,
      type: "customer",
      side: "front",
    },
    {
      title: "Customer ID - Back",
      image: customer.idBack || customer.idBackPreview,
      icon: <IdCard className="h-5 w-5" />,
      type: "customer",
      side: "back",
    },
    ...(customer.supportingPerson
      ? [
          {
            title: "Supporting Person ID - Front",
            image:
              customer.supportingPerson.idFront ||
              customer.supportingPerson.idFrontPreview,
            icon: <IdCard className="h-5 w-5" />,
            type: "supportingPerson",
            side: "front",
          },
          {
            title: "Supporting Person ID - Back",
            image:
              customer.supportingPerson.idBack ||
              customer.supportingPerson.idBackPreview,
            icon: <IdCard className="h-5 w-5" />,
            type: "supportingPerson",
            side: "back",
          },
        ]
      : []),
  ].filter((doc) => doc.image); // Only show documents that have images

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setZoom(1);
  };

  const handleDownload = (image, title) => {
    if (!image) return;

    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = image;
    link.download = `${title.replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] sm:!max-w-[95vw] md:!max-w-[95vw] lg:!max-w-[95vw] !w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              View Documents - {customer.fullName}
            </DialogTitle>
            <DialogDescription>
              View all uploaded ID documents for this customer and supporting person
            </DialogDescription>
          </DialogHeader>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <IdCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded for this customer yet.</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Customer Documents */}
              {customer.idFront || customer.idBack ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Customer Documents</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.idFront && (
                      <DocumentCard
                        document={{
                          title: "ID Front",
                          image: customer.idFront || customer.idFrontPreview,
                        }}
                        onImageClick={handleImageClick}
                        onDownload={handleDownload}
                      />
                    )}
                    {customer.idBack && (
                      <DocumentCard
                        document={{
                          title: "ID Back",
                          image: customer.idBack || customer.idBackPreview,
                        }}
                        onImageClick={handleImageClick}
                        onDownload={handleDownload}
                      />
                    )}
                  </div>
                </div>
              ) : null}

              {/* Supporting Person Documents */}
              {customer.supportingPerson &&
                (customer.supportingPerson.idFront ||
                  customer.supportingPerson.idBack) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          Supporting Person Documents
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({customer.supportingPerson.fullName})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customer.supportingPerson.idFront && (
                          <DocumentCard
                            document={{
                              title: "ID Front",
                              image:
                                customer.supportingPerson.idFront ||
                                customer.supportingPerson.idFrontPreview,
                            }}
                            onImageClick={handleImageClick}
                            onDownload={handleDownload}
                          />
                        )}
                        {customer.supportingPerson.idBack && (
                          <DocumentCard
                            document={{
                              title: "ID Back",
                              image:
                                customer.supportingPerson.idBack ||
                                customer.supportingPerson.idBackPreview,
                            }}
                            onImageClick={handleImageClick}
                            onDownload={handleDownload}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="absolute top-4 left-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleResetZoom}
              >
                <span className="text-sm">{Math.round(zoom * 100)}%</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function DocumentCard({ document, onImageClick, onDownload }) {
  return (
    <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <IdCard className="h-4 w-4" />
          {document.title}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(document.image, document.title)}
          className="h-8"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>
      <div
        className="relative w-full h-64 border rounded-md overflow-hidden cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
        onClick={() => onImageClick(document.image)}
      >
        <img
          src={document.image}
          alt={document.title}
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
          <ZoomIn className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

