import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Car, Shield, CheckCircle, XCircle, AlertTriangle,
  Wrench, Gauge, Battery, Disc, Paintbrush, Settings, Save, ArrowLeft
} from "lucide-react";
import Layout from "@/components/Layout";
import CarLoader from "@/components/CarLoader";

interface InspectionChecklist {
  exterior: {
    paintCondition: boolean;
    bodyDamage: boolean;
    rustCorrosion: boolean;
    lightsWorking: boolean;
    mirrorsIntact: boolean;
    windshieldCracks: boolean;
  };
  interior: {
    seatsCondition: boolean;
    dashboardIntact: boolean;
    acWorking: boolean;
    infotainmentWorking: boolean;
    powerWindowsWorking: boolean;
    steeringCondition: boolean;
  };
  mechanical: {
    engineSound: boolean;
    transmissionSmooth: boolean;
    brakesPedal: boolean;
    suspensionNoise: boolean;
    clutchCondition: boolean;
    exhaustLeaks: boolean;
  };
  electrical: {
    batteryHealth: boolean;
    alternatorWorking: boolean;
    starterMotor: boolean;
    fuseboxIntact: boolean;
    wiringCondition: boolean;
    sensorsWorking: boolean;
  };
  tyres: {
    frontLeftCondition: boolean;
    frontRightCondition: boolean;
    rearLeftCondition: boolean;
    rearRightCondition: boolean;
    spareAvailable: boolean;
    alignmentOk: boolean;
  };
}

const defaultChecklist: InspectionChecklist = {
  exterior: {
    paintCondition: false,
    bodyDamage: false,
    rustCorrosion: false,
    lightsWorking: false,
    mirrorsIntact: false,
    windshieldCracks: false,
  },
  interior: {
    seatsCondition: false,
    dashboardIntact: false,
    acWorking: false,
    infotainmentWorking: false,
    powerWindowsWorking: false,
    steeringCondition: false,
  },
  mechanical: {
    engineSound: false,
    transmissionSmooth: false,
    brakesPedal: false,
    suspensionNoise: false,
    clutchCondition: false,
    exhaustLeaks: false,
  },
  electrical: {
    batteryHealth: false,
    alternatorWorking: false,
    starterMotor: false,
    fuseboxIntact: false,
    wiringCondition: false,
    sensorsWorking: false,
  },
  tyres: {
    frontLeftCondition: false,
    frontRightCondition: false,
    rearLeftCondition: false,
    rearRightCondition: false,
    spareAvailable: false,
    alignmentOk: false,
  },
};

const checklistLabels: Record<string, Record<string, string>> = {
  exterior: {
    paintCondition: "Paint condition is good",
    bodyDamage: "No body damage or dents",
    rustCorrosion: "No rust or corrosion",
    lightsWorking: "All lights working",
    mirrorsIntact: "Mirrors intact",
    windshieldCracks: "No windshield cracks",
  },
  interior: {
    seatsCondition: "Seats in good condition",
    dashboardIntact: "Dashboard intact",
    acWorking: "A/C working properly",
    infotainmentWorking: "Infotainment system working",
    powerWindowsWorking: "Power windows working",
    steeringCondition: "Steering in good condition",
  },
  mechanical: {
    engineSound: "Engine sounds normal",
    transmissionSmooth: "Transmission shifts smoothly",
    brakesPedal: "Brakes working properly",
    suspensionNoise: "No suspension noise",
    clutchCondition: "Clutch in good condition",
    exhaustLeaks: "No exhaust leaks",
  },
  electrical: {
    batteryHealth: "Battery health good",
    alternatorWorking: "Alternator working",
    starterMotor: "Starter motor working",
    fuseboxIntact: "Fusebox intact",
    wiringCondition: "Wiring in good condition",
    sensorsWorking: "All sensors working",
  },
  tyres: {
    frontLeftCondition: "Front left tyre good",
    frontRightCondition: "Front right tyre good",
    rearLeftCondition: "Rear left tyre good",
    rearRightCondition: "Rear right tyre good",
    spareAvailable: "Spare tyre available",
    alignmentOk: "Wheel alignment OK",
  },
};

const categoryIcons: Record<string, any> = {
  exterior: Paintbrush,
  interior: Car,
  mechanical: Wrench,
  electrical: Battery,
  tyres: Disc,
};

const VehicleInspection = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);
  const [inspection, setInspection] = useState<any>(null);
  
  const [checklist, setChecklist] = useState<InspectionChecklist>(defaultChecklist);
  const [scores, setScores] = useState({
    exterior: 70,
    interior: 70,
    mechanical: 70,
    electrical: 70,
    tyres: 70,
  });
  const [notes, setNotes] = useState("");
  const [isCertified, setIsCertified] = useState(false);

  useEffect(() => {
    if (vehicleId) fetchData();
  }, [vehicleId]);

  const fetchData = async () => {
    try {
      // Fetch vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);

      // Fetch existing inspection
      const { data: inspectionData } = await supabase
        .from("vehicle_inspections")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (inspectionData) {
        setInspection(inspectionData);
        if (inspectionData.checklist) {
          setChecklist(inspectionData.checklist as unknown as InspectionChecklist);
        }
        setScores({
          exterior: inspectionData.exterior_score || 70,
          interior: inspectionData.interior_score || 70,
          mechanical: inspectionData.mechanical_score || 70,
          electrical: inspectionData.electrical_score || 70,
          tyres: inspectionData.tyres_score || 70,
        });
        setNotes(inspectionData.notes || "");
        setIsCertified(inspectionData.is_certified || false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = () => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total / 5);
  };

  const handleChecklistChange = (category: keyof InspectionChecklist, item: string, checked: boolean) => {
    setChecklist(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: checked,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const overallScore = calculateOverallScore();

      const inspectionData = {
        vehicle_id: vehicleId,
        inspector_id: user.id,
        overall_score: overallScore,
        exterior_score: scores.exterior,
        interior_score: scores.interior,
        mechanical_score: scores.mechanical,
        electrical_score: scores.electrical,
        tyres_score: scores.tyres,
        checklist: checklist as unknown as Record<string, any>,
        notes: notes,
        is_certified: isCertified,
        updated_at: new Date().toISOString(),
      };

      if (inspection?.id) {
        await supabase
          .from("vehicle_inspections")
          .update(inspectionData)
          .eq("id", inspection.id);
      } else {
        await supabase
          .from("vehicle_inspections")
          .insert(inspectionData);
      }

      toast({ title: "Inspection saved successfully!" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  if (loading) {
    return <Layout><CarLoader /></Layout>;
  }

  if (!vehicle) {
    return (
      <Layout>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Vehicle Not Found</h2>
          <Button onClick={() => navigate("/vehicles")}>Back to Vehicles</Button>
        </Card>
      </Layout>
    );
  }

  const overallScore = calculateOverallScore();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="h-7 w-7 text-blue-600" />
                Vehicle Inspection
              </h1>
              <p className="text-slate-500">{vehicle.brand} {vehicle.model} ({vehicle.manufacturing_year})</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Inspection"}
          </Button>
        </div>

        {/* Overall Score Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className={`${getScoreBg(overallScore)} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium opacity-90">Overall Condition Score</h2>
                <p className="text-5xl font-bold mt-2">{overallScore}/100</p>
              </div>
              <div className="text-right">
                <Badge className={`${isCertified ? 'bg-white/20' : 'bg-black/20'} text-white border-0`}>
                  {isCertified ? (
                    <><Shield className="h-4 w-4 mr-1" /> Certified</>
                  ) : (
                    "Not Certified"
                  )}
                </Badge>
                <div className="flex items-center gap-2 mt-4">
                  <Checkbox
                    id="certified"
                    checked={isCertified}
                    onCheckedChange={(checked) => setIsCertified(!!checked)}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-emerald-600"
                  />
                  <label htmlFor="certified" className="text-sm">Mark as Certified</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Score Bars */}
          <CardContent className="p-6">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(scores).map(([key, score]) => {
                const Icon = categoryIcons[key];
                return (
                  <div key={key} className="text-center">
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${getScoreColor(score)}`} />
                    <p className="text-xs text-slate-500 capitalize mb-1">{key}</p>
                    <p className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inspection Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(checklist) as Array<keyof InspectionChecklist>).map((category) => {
            const Icon = categoryIcons[category];
            return (
              <Card key={category} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg capitalize">
                      <Icon className="h-5 w-5 text-blue-600" />
                      {category}
                    </CardTitle>
                    <Badge className={`${getScoreColor(scores[category as keyof typeof scores])} bg-transparent border-current`}>
                      {scores[category as keyof typeof scores]}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Slider */}
                  <div>
                    <Slider
                      value={[scores[category as keyof typeof scores]]}
                      onValueChange={(v) => setScores(prev => ({ ...prev, [category]: v[0] }))}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {Object.entries(checklist[category]).map(([item, checked]) => (
                      <label 
                        key={item} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => handleChecklistChange(category, item, !!c)}
                        />
                        <span className={`text-sm ${checked ? 'text-slate-900' : 'text-slate-500'}`}>
                          {checklistLabels[category][item]}
                        </span>
                        {checked ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-300 ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Notes */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Inspector Notes</CardTitle>
            <CardDescription>Additional observations and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter inspection notes, issues found, recommendations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VehicleInspection;
