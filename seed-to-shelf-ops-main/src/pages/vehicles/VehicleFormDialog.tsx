{/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Docs & Media</TabsTrigger>
                <TabsTrigger value="public">Public Page</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={handleVehicleTypeChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{vehicleTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{conditions.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => {
  if (v === "sold") {
    toast({
      title: "Action blocked",
      description: "Vehicle can be sold only via Sales",
      variant: "destructive",
    });
    return;
  }
  setFormData({ ...formData, status: v as any });
}}
>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Select value={formData.brand || ""} onValueChange={handleBrandChange}>
                      <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {availableBrands.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model *</Label>
                    <Select value={formData.model || ""} onValueChange={handleModelChange} disabled={!formData.brand}>
                      <SelectTrigger><SelectValue placeholder={formData.brand ? "Select model" : "Select brand first"} /></SelectTrigger>
                      <SelectContent>
                        {availableModels.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Variant</Label>
                    <Select value={formData.variant || ""} onValueChange={(v) => setFormData({ ...formData, variant: v })} disabled={!formData.model}>
                      <SelectTrigger><SelectValue placeholder={formData.model ? "Select variant" : "Select model first"} /></SelectTrigger>
                      <SelectContent>
                        {availableVariants.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Manufacturing Year *</Label>
                    <Input type="number" value={formData.manufacturing_year || ""} onChange={(e) => setFormData({ ...formData, manufacturing_year: parseInt(e.target.value) })} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select value={formData.color || ""} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                      <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                      <SelectContent>
                        {vehicleColors.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c.code }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fuel Type</Label>
                    <Select value={formData.fuel_type} onValueChange={(v) => setFormData({ ...formData, fuel_type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{fuelTypes.map((f) => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transmission</Label>
                    <Select value={formData.transmission} onValueChange={(v) => setFormData({ ...formData, transmission: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{transmissions.map((t) => <SelectItem key={t} value={t} className="uppercase">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Registration No</Label>
                    <Input value={formData.registration_number || ""} onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Engine No</Label>
                    <Input value={formData.engine_number || ""} onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Chassis No</Label>
                    <Input value={formData.chassis_number || ""} onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Odometer Reading (km)</Label>
                    <Input type="number" value={formData.odometer_reading || ""} onChange={(e) => setFormData({ ...formData, odometer_reading: parseInt(e.target.value) || null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price *</Label>
                    <Input
  type="text"
  inputMode="numeric"
  placeholder="₹ 5,50,000"
  value={purchasePriceDisplay}
  disabled={hasPurchasePayment}
  className={hasPurchasePayment ? "opacity-60 cursor-not-allowed" : ""}
  onChange={(e) => {
    if (hasPurchasePayment) return;

    const formatted = formatIndianNumber(e.target.value);
    setPurchasePriceDisplay(formatted);
    setFormData({
      ...formData,
      purchase_price: parseIndianNumber(formatted),
    });
  }}
  required={formData.purchase_status === "purchased"}
/>

{hasPurchasePayment && (
  <p className="text-xs text-amber-600">
    Purchase price is locked because payments have already started.
  </p>
)}


                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price *</Label>
                    <Input
  type="text"
  inputMode="numeric"
  placeholder="₹ 6,25,000"
  value={sellingPriceDisplay}
  onChange={(e) => {
    const formatted = formatIndianNumber(e.target.value);
    setSellingPriceDisplay(formatted);
    setFormData({
      ...formData,
      selling_price: parseIndianNumber(formatted),
    });
  }}
  required
/>

                  </div>

                  {/* Purchase Toggle */}
<div className="space-y-2 md:col-span-3">
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div>
      <Label>Purchased from Vendor</Label>
      <p className="text-xs text-muted-foreground">
        Turn ON if this vehicle is bought from a vendor.
        Turn OFF if it is only listed for leads.
      </p>
    </div>

    <Switch
  checked={formData.purchase_status === "purchased"}
  disabled={selectedVehicle?.purchase_status === "purchased"}
  onCheckedChange={(checked) => {
    if (!checked) return; // cannot turn OFF

    // 🔒 FIX 2: Block if purchase price missing
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      toast({
        title: "Purchase price required",
        description: "Enter purchase price before marking as purchased",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      purchase_status: "purchased",
    });
  }}
/>

  </div>

  {selectedVehicle?.purchase_status === "purchased" && (
    <p className="text-xs text-amber-600">
      Purchased vehicles cannot be converted back to listing-only.
    </p>
  )}
</div>

                  <div className="space-y-2">
                    <Label>
  Vendor <span className="text-red-500">*</span>
</Label>

                    <Select value={formData.vendor_id || ""} onValueChange={(v) => setFormData({ ...formData, vendor_id: v  })}
                     disabled={
  formData.purchase_status !== "purchased" ||
  selectedVehicle?.purchase_status === "purchased"
} // 🔒 lock on edit
                      >
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        
                        {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {formData.purchase_status !== "purchased" && (
  <p className="text-xs text-muted-foreground">
    Vendor not required for listing-only vehicles
  </p>
)}

{formData.purchase_status === "purchased" && !formData.vendor_id && (
  <p className="text-xs text-red-500">
    Vendor is mandatory for purchased vehicles
  </p>
)}


                    

                    {selectedVehicle && (
  <p className="text-xs text-muted-foreground">
    Vendor cannot be changed after vehicle creation
  </p>
)}

                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                </div>
              </TabsContent>

              {/* Details Tab - Automotive specific */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Additional automotive details based on vehicle type</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tyre Condition</Label>
                    <Select value={(formData as any).tyre_condition || ""} onValueChange={(v) => setFormData({ ...formData, tyre_condition: v } as any)}>
                      <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                      <SelectContent>{tyreConditions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Battery Health</Label>
                    <Select value={(formData as any).battery_health || ""} onValueChange={(v) => setFormData({ ...formData, battery_health: v } as any)}>
                      <SelectTrigger><SelectValue placeholder="Select health" /></SelectTrigger>
                      <SelectContent>{batteryHealthOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Owners</Label>
                    <Input type="number" min="1" value={(formData as any).number_of_owners || 1} onChange={(e) => setFormData({ ...formData, number_of_owners: parseInt(e.target.value) || 1 } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Expiry</Label>
                    <Input type="date" value={(formData as any).insurance_expiry || ""} onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>PUC Expiry</Label>
                    <Input type="date" value={(formData as any).puc_expiry || ""} onChange={(e) => setFormData({ ...formData, puc_expiry: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fitness Expiry</Label>
                    <Input type="date" value={(formData as any).fitness_expiry || ""} onChange={(e) => setFormData({ ...formData, fitness_expiry: e.target.value } as any)} />
                  </div>
                  {formData.vehicle_type === "commercial" && (
                    <>
                      <div className="space-y-2">
                        <Label>Permit Expiry</Label>
                        <Input type="date" value={(formData as any).permit_expiry || ""} onChange={(e) => setFormData({ ...formData, permit_expiry: e.target.value } as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Road Tax Expiry</Label>
                        <Input type="date" value={(formData as any).road_tax_expiry || ""} onChange={(e) => setFormData({ ...formData, road_tax_expiry: e.target.value } as any)} />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Mileage (km/l)</Label>
                    <Input type="number" step="0.1" value={(formData as any).mileage || ""} onChange={(e) => setFormData({ ...formData, mileage: parseFloat(e.target.value) } as any)} />
                  </div>
                  {formData.vehicle_type === "car" && (
                    <>
                      <div className="space-y-2">
                        <Label>Seating Capacity</Label>
                        <Input type="number" value={(formData as any).seating_capacity || ""} onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) } as any)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Boot Space</Label>
                        <Input value={(formData as any).boot_space || ""} onChange={(e) => setFormData({ ...formData, boot_space: e.target.value } as any)} placeholder="e.g., 350 liters" />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Last Service Date</Label>
                    <Input type="date" value={(formData as any).last_service_date || ""} onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Service Due</Label>
                    <Input type="date" value={(formData as any).next_service_due || ""} onChange={(e) => setFormData({ ...formData, next_service_due: e.target.value } as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hypothecation (if any)</Label>
                    <Input value={(formData as any).hypothecation || ""} onChange={(e) => setFormData({ ...formData, hypothecation: e.target.value } as any)} placeholder="Bank/Finance company name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service History</Label>
                  <Textarea value={(formData as any).service_history || ""} onChange={(e) => setFormData({ ...formData, service_history: e.target.value } as any)} rows={3} placeholder="Service history details..." />
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                {selectedVehicle && existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Images ({existingImages.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((img) => (
  <div key={img.id} className="relative group">
    <img
      src={img.image_url}
      alt=""
      className="h-16 w-20 object-cover rounded border border-border"
    />

    {/* Primary badge */}
    {img.is_primary && (
      <Badge className="absolute -top-2 -left-2 text-xs">
        Primary
      </Badge>
    )}

    {/* ❌ Delete button */}
    <Button
  type="button" // 🔥 VERY IMPORTANT
  size="icon"
  variant="destructive"
  className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition"
  onClick={(e) => {
    e.preventDefault();     // ⛔ stop form submit
    e.stopPropagation();    // ⛔ stop dialog events
    deleteExistingImage(img);
  }}
>
  <X className="h-3 w-3" />
</Button>

  </div>
))}

                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Add New Images</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Click to upload images</span>
                    </label>
                  </div>
                  {pendingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pendingImages.map((file, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(file)} alt="" className="h-16 w-20 object-cover rounded" />
                          <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5" onClick={() => removePendingImage(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedVehicle && existingDocs.length > 0 && (
                  <div className="space-y-2">
                    <Label>Existing Documents ({existingDocs.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {existingDocs.map((doc) => (
  <div
    key={doc.id}
    className="flex items-center gap-2 bg-muted px-3 py-2 rounded"
  >
    <FileText className="h-4 w-4" />

    <span className="text-sm flex-1 truncate">
      {doc.document_name}
    </span>

    <Select
      value={doc.document_type as DocumentType}
      onValueChange={(v) =>
        updateDocumentType(doc.id, v as DocumentType)
      }
    >
      <SelectTrigger className="w-36 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {documentTypes.map((t) => (
  <SelectItem key={t.value} value={t.value}>

  <div className="flex items-center gap-2">
    <span
      className={`px-2 py-0.5 rounded text-xs border ${
        documentTypeMeta[t.value].className
      }`}
    >
      {documentTypeMeta[t.value].label}
    </span>
  </div>
</SelectItem>

        ))}
      </SelectContent>
    </Select>

    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => openDocViewer(doc.document_url)}
    >
      <Eye className="h-4 w-4" />
    </Button>
  </div>
))}

                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Add New Documents (RC, Insurance, etc.)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleDocChange} className="hidden" id="doc-upload" />
                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                      <FileText className="h-8 w-8" />
                      <span>Click to upload documents</span>
                    </label>
                  </div>
                  {pendingDocs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pendingDocs.map((doc, i) => (
  <div key={i} className="flex items-center gap-2 bg-muted px-3 py-2 rounded">
    <FileText className="h-4 w-4" />

    <span className="text-sm flex-1 truncate">
      {doc.file.name}
    </span>

    <Select
      value={doc.type}
      onValueChange={(v) => {
  const updated = [...pendingDocs];
  updated[i].type = v as DocumentType;
  setPendingDocs(updated);
}}

    >
      <SelectTrigger className="w-36 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {documentTypes.map((t) => (
  <SelectItem key={t.value} value={t.value}>

  <div className="flex items-center gap-2">
    <span
      className={`px-2 py-0.5 rounded text-xs border ${
        documentTypeMeta[t.value].className
      }`}
    >
      {documentTypeMeta[t.value].label}
    </span>
  </div>
</SelectItem>

        ))}
      </SelectContent>
    </Select>

    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6"
      onClick={() => removePendingDoc(i)}
    >
      <X className="h-3 w-3" />
    </Button>
  </div>
))}

                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Public Page Tab */}
              <TabsContent value="public" className="space-y-4 mt-4">
                <Card className="border">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Make Vehicle Public</Label>
                        <p className="text-sm text-muted-foreground">Generate a shareable public page for this vehicle</p>
                      </div>
                      <Switch 
                        checked={formData.is_public || false} 
                        onCheckedChange={(v) => setFormData({ ...formData, is_public: v })} 
                      />
                    </div>

                    {formData.is_public && (
                      <>
                        <Separator />
                        
                        {(selectedVehicle?.public_page_id || formData.public_page_id) && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Globe className="h-5 w-5 text-green-600" />
                            <code className="flex-1 text-sm">{window.location.origin}/v/{selectedVehicle?.public_page_id || formData.public_page_id}</code>
                            <Button size="sm" variant="outline" onClick={() => copyPublicLink(selectedVehicle?.public_page_id || formData.public_page_id || "")} className="gap-1">
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label>Show Engine Number</Label>
                              <p className="text-xs text-muted-foreground">Display on public page</p>
                            </div>
                            <Switch 
                              checked={formData.show_engine_number || false} 
                              onCheckedChange={(v) => setFormData({ ...formData, show_engine_number: v })} 
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label>Show Chassis Number</Label>
                              <p className="text-xs text-muted-foreground">Display on public page</p>
                            </div>
                            <Switch 
                              checked={formData.show_chassis_number || false} 
                              onCheckedChange={(v) => setFormData({ ...formData, show_chassis_number: v })} 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Public Description</Label>
                          <Textarea 
                            value={formData.public_description || ""} 
                            onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
                            placeholder="Write a compelling description for potential buyers..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Highlights (comma separated)</Label>
                          <Textarea
  value={highlightsText}
  onChange={(e) => {
    const value = e.target.value;
    setHighlightsText(value);
    setFormData({
      ...formData,
      public_highlights: value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean),
    });
  }}
  placeholder="Single Owner, Accident Free, Well Maintained"
  rows={2}
/>

                        </div>

                        <div className="space-y-2">
                          <Label>Features (comma separated)</Label>
                          <Textarea
  value={featuresText}
  onChange={(e) => {
    const value = e.target.value;
    setFeaturesText(value);
    setFormData({
      ...formData,
      public_features: value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean),
    });
  }}
  placeholder="Sunroof, Leather Seats, Apple CarPlay"
  rows={2}
/>

                        </div>

                        <Separator />

<div className="space-y-2">
  <Label>Vehicle Image Badge (Boost Clicks)</Label>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {/* Badge Text */}
    <div>
      <Input
        maxLength={20}
        placeholder="Eg: 🔥 Best Price"
        value={formData.image_badge_text || ""}
        onChange={(e) =>
          setFormData({ ...formData, image_badge_text: e.target.value })
        }
      />
      <p className="text-xs text-muted-foreground mt-1">
        Keep it under <b>3 words</b> for best results
      </p>
    </div>

    {/* Badge Color */}
    <div>
      <Select
        value={formData.image_badge_color || "emerald"}
        onValueChange={(v) =>
          setFormData({ ...formData, image_badge_color: v })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select badge color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="emerald">🟢 Emerald (Trust)</SelectItem>
          <SelectItem value="rose">🔴 Rose (Urgency)</SelectItem>
          <SelectItem value="amber">🟡 Amber (Attention)</SelectItem>
          <SelectItem value="indigo">🔵 Indigo (Premium)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* AI Suggestions */}
  <div className="bg-muted/50 p-3 rounded-lg text-sm">
    <p className="font-medium mb-1">✨ Suggested High-Conversion Tags</p>
    <div className="flex flex-wrap gap-2">
      {["🔥 Best Price", "💰 EMI Available", "⚡ Ready to Drive", "⭐ Verified"].map(
        (tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() =>
              setFormData({ ...formData, image_badge_text: tag })
            }
          >
            {tag}
          </Badge>
        )
      )}
    </div>
  </div>
</div>


                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
  type="submit"
  disabled={
  uploadingImages ||
  isSubmitting ||
  (formData.purchase_status === "purchased" && !formData.vendor_id)
}

>

                {uploadingImages || isSubmitting ? "Saving..." : (selectedVehicle ? "Update" : "Add")} Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>