// Complete vehicle brands, models, variants, and colors data

export interface VehicleVariant {
  name: string;
  fuelTypes?: string[];
}

export interface VehicleModel {
  name: string;
  variants: VehicleVariant[];
}

export interface VehicleBrand {
  name: string;
  models: VehicleModel[];
}

// Car brands data
export const carBrands: VehicleBrand[] = [
  {
    name: "Maruti Suzuki",
    models: [
      { name: "Alto", variants: [{ name: "Std" }, { name: "LXi" }, { name: "VXi" }, { name: "VXi+" }] },
      { name: "Swift", variants: [{ name: "LXi" }, { name: "VXi" }, { name: "ZXi" }, { name: "ZXi+" }] },
      { name: "Dzire", variants: [{ name: "LXi" }, { name: "VXi" }, { name: "ZXi" }, { name: "ZXi+" }] },
      { name: "Baleno", variants: [{ name: "Sigma" }, { name: "Delta" }, { name: "Zeta" }, { name: "Alpha" }] },
      { name: "Vitara Brezza", variants: [{ name: "LXi" }, { name: "VXi" }, { name: "ZXi" }, { name: "ZXi+" }] },
      { name: "Ertiga", variants: [{ name: "LXi" }, { name: "VXi" }, { name: "ZXi" }, { name: "ZXi+" }] },
      { name: "Wagon R", variants: [{ name: "LXi" }, { name: "VXi" }, { name: "ZXi" }, { name: "ZXi+" }] },
      { name: "Celerio", variants: [{ name: "LXi" }, { name: "VXi" }, { name: "ZXi" }, { name: "ZXi+" }] },
      { name: "Ignis", variants: [{ name: "Sigma" }, { name: "Delta" }, { name: "Zeta" }, { name: "Alpha" }] },
      { name: "Ciaz", variants: [{ name: "Sigma" }, { name: "Delta" }, { name: "Zeta" }, { name: "Alpha" }] },
      { name: "XL6", variants: [{ name: "Zeta" }, { name: "Alpha" }, { name: "Alpha+" }] },
      { name: "Grand Vitara", variants: [{ name: "Sigma" }, { name: "Delta" }, { name: "Zeta" }, { name: "Alpha" }, { name: "Alpha+" }] },
      { name: "Jimny", variants: [{ name: "Zeta" }, { name: "Alpha" }] },
      { name: "Fronx", variants: [{ name: "Sigma" }, { name: "Delta" }, { name: "Delta+" }, { name: "Zeta" }, { name: "Zeta+" }, { name: "Alpha" }, { name: "Alpha+" }] },
      { name: "Invicto", variants: [{ name: "Zeta" }, { name: "Zeta+" }, { name: "Alpha" }, { name: "Alpha+" }] },
      { name: "S-Presso", variants: [{ name: "Std" }, { name: "LXi" }, { name: "VXi" }, { name: "VXi+" }, { name: "VXi+ AGS" }] },
      { name: "Alto K10", variants: [{ name: "Std" }, { name: "LXi" }, { name: "VXi" }, { name: "VXi+" }, { name: "VXi+ AGS" }] },
      { name: "Eeco", variants: [{ name: "5 Seater" }, { name: "7 Seater" }, { name: "Cargo" }, { name: "Ambulance" }] },
      { name: "Ritz", variants: [{ name: "LXi" }, { name: "VXi" }] },
      { name: "A-Star", variants: [{ name: "LXi" }, { name: "VXi" }] },
    ],
  },
  {
    name: "Hyundai",
    models: [
      { name: "i10", variants: [{ name: "Era" }, { name: "Magna" }, { name: "Sportz" }, { name: "Asta" }] },
      { name: "i20", variants: [{ name: "Era" }, { name: "Magna" }, { name: "Sportz" }, { name: "Asta" }, { name: "Asta(O)" }] },
      { name: "Grand i10", variants: [{ name: "Era" }, { name: "Magna" }, { name: "Sportz" }, { name: "Asta" }] },
      { name: "Aura", variants: [{ name: "E" }, { name: "S" }, { name: "SX" }, { name: "SX+" }] },
      { name: "Venue", variants: [{ name: "E" }, { name: "S" }, { name: "S+" }, { name: "SX" }, { name: "SX+" }, { name: "SX(O)" }] },
      { name: "Creta", variants: [{ name: "E" }, { name: "EX" }, { name: "S" }, { name: "SX" }, { name: "SX(O)" }] },
      { name: "Verna", variants: [{ name: "EX" }, { name: "S" }, { name: "SX" }, { name: "SX(O)" }] },
      { name: "Alcazar", variants: [{ name: "Prestige" }, { name: "Platinum" }, { name: "Signature" }] },
      { name: "Tucson", variants: [{ name: "GL" }, { name: "GLS" }, { name: "Signature" }] },
      { name: "Exter", variants: [{ name: "EX" }, { name: "S" }, { name: "SX" }, { name: "SX Connect" }, { name: "SX(O)" }, { name: "SX(O) Connect" }] },
      { name: "i20 N Line", variants: [{ name: "N6" }, { name: "N8" }, { name: "N8 DCT" }] },
      { name: "Ioniq 5", variants: [{ name: "Standard" }, { name: "Long Range" }] },
      { name: "Kona Electric", variants: [{ name: "Premium" }, { name: "Executive" }] },
      { name: "Xcent", variants: [{ name: "E" }, { name: "S" }, { name: "SX" }] },

    ],
  },
  {
    name: "Tata",
    models: [
      { name: "Tiago", variants: [{ name: "XE" }, { name: "XM" }, { name: "XT" }, { name: "XZ" }, { name: "XZ+" }] },
      { name: "Tigor", variants: [{ name: "XE" }, { name: "XM" }, { name: "XZ" }, { name: "XZ+" }] },
      { name: "Altroz", variants: [{ name: "XE" }, { name: "XM" }, { name: "XM+" }, { name: "XT" }, { name: "XZ" }, { name: "XZ+" }] },
      { name: "Nexon", variants: [{ name: "XE" }, { name: "XM" }, { name: "XM+" }, { name: "XZ" }, { name: "XZ+" }, { name: "XZ+(O)" }] },
      { name: "Punch", variants: [{ name: "Pure" }, { name: "Adventure" }, { name: "Accomplished" }, { name: "Creative" }] },
      { name: "Harrier", variants: [{ name: "XE" }, { name: "XM" }, { name: "XT" }, { name: "XT+" }, { name: "XZ" }, { name: "XZ+" }, { name: "XZA+" }] },
      { name: "Safari", variants: [{ name: "XE" }, { name: "XM" }, { name: "XT" }, { name: "XT+" }, { name: "XZ" }, { name: "XZ+" }, { name: "XZA+" }] },
      { name: "Curvv", variants: [{ name: "Smart" }, { name: "Pure" }, { name: "Creative" }, { name: "Creative+" }, { name: "Accomplished" }, { name: "Accomplished+" }] },
      { name: "Tiago EV", variants: [{ name: "XE" }, { name: "XT" }, { name: "XZ+" }, { name: "XZ+ Tech LUX" }] },
      { name: "Nexon EV", variants: [{ name: "XM" }, { name: "XZ+" }, { name: "XZ+ LUX" }, { name: "XZ+ Dark" }] },
      { name: "Punch EV", variants: [{ name: "Smart" }, { name: "Adventure" }, { name: "Accomplished" }, { name: "Empowered" }] },
    ],
  },
  {
    name: "Mahindra",
    models: [
      { name: "Bolero", variants: [{ name: "B4" }, { name: "B6" }, { name: "B6(O)" }] },
      { name: "Scorpio", variants: [{ name: "S3" }, { name: "S5" }, { name: "S7" }, { name: "S9" }, { name: "S11" }] },
      { name: "Scorpio N", variants: [{ name: "Z4" }, { name: "Z6" }, { name: "Z8" }, { name: "Z8L" }] },
      { name: "XUV300", variants: [{ name: "W4" }, { name: "W6" }, { name: "W8" }, { name: "W8(O)" }] },
      { name: "XUV400", variants: [{ name: "EC" }, { name: "EL" }, { name: "EL Pro" }] },
      { name: "XUV500", variants: [{ name: "W5" }, { name: "W7" }, { name: "W9" }, { name: "W11" }] },
      { name: "XUV700", variants: [{ name: "MX" }, { name: "AX3" }, { name: "AX5" }, { name: "AX7" }, { name: "AX7L" }] },
      { name: "Thar", variants: [{ name: "AX" }, { name: "AX Opt" }, { name: "LX" }] },
      { name: "Thar Roxx", variants: [{ name: "MX1" }, { name: "MX3" }, { name: "MX5" }, { name: "AX3L" }, { name: "AX5L" }, { name: "AX7L" }] },
      { name: "XUV 3XO", variants: [{ name: "MX1" }, { name: "MX2" }, { name: "MX3" }, { name: "AX3" }, { name: "AX5" }, { name: "AX7" }, { name: "AX7L" }] },
      { name: "BE 6", variants: [{ name: "Pack One" }, { name: "Pack Two" }, { name: "Pack Three" }] },
      { name: "XEV 9e", variants: [{ name: "Pack One" }, { name: "Pack Two" }, { name: "Pack Three" }] },
    ],
  },
  {
    name: "Kia",
    models: [
      { name: "Seltos", variants: [{ name: "HTE" }, { name: "HTK" }, { name: "HTK+" }, { name: "HTX" }, { name: "HTX+" }, { name: "GTX" }, { name: "GTX+" }, { name: "X-Line" }] },
      { name: "Sonet", variants: [{ name: "HTE" }, { name: "HTK" }, { name: "HTK+" }, { name: "HTX" }, { name: "HTX+" }, { name: "GTX" }, { name: "GTX+" }] },
      { name: "Carens", variants: [{ name: "Premium" }, { name: "Prestige" }, { name: "Prestige Plus" }, { name: "Luxury" }, { name: "Luxury Plus" }, { name: "X-Line" }] },
      { name: "EV6", variants: [{ name: "GT-Line" }, { name: "GT-Line AWD" }] },
      { name: "EV9", variants: [{ name: "GT-Line" }, { name: "GT-Line AWD" }] },
      { name: "Carnival", variants: [{ name: "Premium" }, { name: "Prestige" }, { name: "Limousine" }, { name: "Limousine Plus" }] },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Glanza", variants: [{ name: "E" }, { name: "S" }, { name: "G" }, { name: "V" }] },
      { name: "Urban Cruiser", variants: [{ name: "Mid" }, { name: "High" }, { name: "Premium" }] },
      { name: "Innova Crysta", variants: [{ name: "GX" }, { name: "VX" }, { name: "ZX" }] },
      { name: "Innova Hycross", variants: [{ name: "G" }, { name: "GX" }, { name: "VX" }, { name: "ZX" }, { name: "ZX(O)" }] },
      { name: "Fortuner", variants: [{ name: "4x2" }, { name: "4x4" }, { name: "Legender" }, { name: "GR-S" }] },
      { name: "Hilux", variants: [{ name: "Standard" }, { name: "High" }] },
      { name: "Camry", variants: [{ name: "Hybrid" }] },
      { name: "Vellfire", variants: [{ name: "Executive Lounge" }] },
      { name: "Land Cruiser", variants: [{ name: "LC300" }] },
      { name: "Taisor", variants: [{ name: "E" }, { name: "S" }, { name: "S+" }, { name: "G" }, { name: "V" }] },
      { name: "Rumion", variants: [{ name: "S" }, { name: "G" }, { name: "V" }] },
      { name: "Etios", variants: [{ name: "G" }, { name: "V" }] },
      { name: "Etios Liva", variants: [{ name: "G" }, { name: "V" }] },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "Amaze", variants: [{ name: "E" }, { name: "S" }, { name: "VX" }, { name: "VX CVT" }] },
      { name: "City", variants: [{ name: "V" }, { name: "VX" }, { name: "ZX" }] },
      { name: "City e:HEV", variants: [{ name: "V" }, { name: "VX" }, { name: "ZX" }] },
      { name: "Elevate", variants: [{ name: "SV" }, { name: "V" }, { name: "VX" }, { name: "ZX" }] },
      { name: "Jazz", variants: [{ name: "V" }, { name: "VX" }] },
      { name: "WR-V", variants: [{ name: "S" }, { name: "VX" }] },
      { 
  name: "Civic", 
  variants: [
    { name: "V" },
    { name: "VX" },
    { name: "ZX" },
    { name: "RS" }
  ] 
},

    ],
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Polo", variants: [{ name: "Trendline" }, { name: "Comfortline" }, { name: "Highline" }, { name: "GT TSI" }] },
      { name: "Vento", variants: [{ name: "Trendline" }, { name: "Comfortline" }, { name: "Highline" }, { name: "Highline Plus" }] },
      { name: "Taigun", variants: [{ name: "Comfortline" }, { name: "Highline" }, { name: "Topline" }, { name: "GT" }, { name: "GT Plus" }] },
      { name: "Virtus", variants: [{ name: "Comfortline" }, { name: "Highline" }, { name: "Topline" }, { name: "GT" }, { name: "GT Plus" }] },
      { name: "Tiguan", variants: [{ name: "Elegance" }, { name: "Exclusive" }] },
    ],
  },
  {
    name: "Skoda",
    models: [
      { name: "Slavia", variants: [{ name: "Active" }, { name: "Ambition" }, { name: "Style" }, { name: "Monte Carlo" }] },
      { name: "Kushaq", variants: [{ name: "Active" }, { name: "Ambition" }, { name: "Style" }, { name: "Monte Carlo" }] },
      { name: "Superb", variants: [{ name: "Sportline" }, { name: "L&K" }] },
      { name: "Kodiaq", variants: [{ name: "Style" }, { name: "Sportline" }, { name: "L&K" }] },
      { name: "Kylaq", variants: [{ name: "Classic" }, { name: "Signature" }, { name: "Signature+" }, { name: "Prestige" }] },
      { name: "Rapid", variants: [{ name: "Active" }, { name: "Ambition" }, { name: "Style" }] }

    ],
  },
  {
    name: "Renault",
    models: [
      { name: "Kwid", variants: [{ name: "RXE" }, { name: "RXL" }, { name: "RXT" }, { name: "Climber" }] },
      { name: "Triber", variants: [{ name: "RXE" }, { name: "RXL" }, { name: "RXT" }, { name: "RXZ" }] },
      { name: "Kiger", variants: [{ name: "RXE" }, { name: "RXL" }, { name: "RXT" }, { name: "RXZ" }] },
    ],
  },
  {
    name: "Nissan",
    models: [
      { name: "Magnite", variants: [{ name: "XE" }, { name: "XL" }, { name: "XV" }, { name: "XV Premium" }] },
      { name: "Kicks", variants: [{ name: "XL" }, { name: "XV" }, { name: "XV Premium" }] },
      { name: "X-Trail", variants: [{ name: "XV" }, { name: "XV Premium" }] },
    ],
  },
  {
    name: "MG",
    models: [
      { name: "Hector", variants: [{ name: "Style" }, { name: "Super" }, { name: "Smart" }, { name: "Sharp" }, { name: "Savvy" }] },
      { name: "Hector Plus", variants: [{ name: "Style" }, { name: "Super" }, { name: "Smart" }, { name: "Sharp" }, { name: "Savvy" }] },
      { name: "Astor", variants: [{ name: "Style" }, { name: "Super" }, { name: "Smart" }, { name: "Sharp" }, { name: "Savvy" }] },
      { name: "ZS EV", variants: [{ name: "Excite" }, { name: "Exclusive" }, { name: "Essence" }] },
      { name: "Gloster", variants: [{ name: "Super" }, { name: "Sharp" }, { name: "Savvy" }] },
      { name: "Comet EV", variants: [{ name: "Comet" }] },
      { name: "Windsor EV", variants: [{ name: "Excite" }, { name: "Exclusive" }, { name: "Essence" }] },
    ],
  },
  {
    name: "Jeep",
    models: [
      { name: "Compass", variants: [{ name: "Sport" }, { name: "Longitude" }, { name: "Limited" }, { name: "Model S" }] },
      { name: "Meridian", variants: [{ name: "Limited" }, { name: "Limited (O)" }, { name: "Overland" }] },
      { name: "Wrangler", variants: [{ name: "Unlimited" }, { name: "Rubicon" }] },
      { name: "Grand Cherokee", variants: [{ name: "Limited" }, { name: "Summit Reserve" }] },
    ],
  },
  {
    name: "BMW",
    models: [
      { name: "2 Series Gran Coupe", variants: [{ name: "220i Sport" }, { name: "220i M Sport" }] },
      { name: "3 Series", variants: [{ name: "320i Sport" }, { name: "320Ld Luxury" }, { name: "330i M Sport" }, { name: "M340i" }] },
      { name: "5 Series", variants: [{ name: "520d Luxury" }, { name: "530d M Sport" }, { name: "530i M Sport" }] },
      { name: "7 Series", variants: [{ name: "740i" }, { name: "760Li" }] },
      { name: "X1", variants: [{ name: "sDrive18i" }, { name: "sDrive20d" }, { name: "xDrive20d" }] },
      { name: "X3", variants: [{ name: "xDrive20d" }, { name: "xDrive30d" }, { name: "M40i" }] },
      { name: "X5", variants: [{ name: "xDrive30d" }, { name: "xDrive40i" }, { name: "M50i" }] },
      { name: "X7", variants: [{ name: "xDrive40i" }, { name: "M50d" }] },
      { name: "iX", variants: [{ name: "xDrive40" }, { name: "xDrive50" }, { name: "M60" }] },
      { name: "i7", variants: [{ name: "xDrive60" }, { name: "M70" }] },
      { name: "i4", variants: [{ name: "eDrive35" }, { name: "eDrive40" }, { name: "M50" }] },
      { name: "i5", variants: [{ name: "eDrive40" }, { name: "M60 xDrive" }] },
    ],
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "A-Class", variants: [{ name: "A200" }, { name: "A200d" }, { name: "AMG A35" }] },
      { name: "C-Class", variants: [{ name: "C200" }, { name: "C220d" }, { name: "C300d" }, { name: "AMG C43" }] },
      { name: "E-Class", variants: [{ name: "E200" }, { name: "E220d" }, { name: "E350d" }, { name: "AMG E53" }] },
      { name: "S-Class", variants: [{ name: "S350d" }, { name: "S450" }, { name: "S580" }, { name: "Maybach S580" }] },
      { name: "GLA", variants: [{ name: "GLA200" }, { name: "GLA220d" }, { name: "AMG GLA35" }] },
      { name: "GLB", variants: [{ name: "GLB200" }, { name: "GLB220d" }, { name: "AMG GLB35" }] },
      { name: "GLC", variants: [{ name: "GLC200" }, { name: "GLC220d" }, { name: "GLC300" }, { name: "AMG GLC43" }] },
      { name: "GLE", variants: [{ name: "GLE300d" }, { name: "GLE450" }, { name: "AMG GLE53" }, { name: "AMG GLE63S" }] },
      { name: "GLS", variants: [{ name: "GLS400d" }, { name: "GLS450" }, { name: "AMG GLS63" }, { name: "Maybach GLS600" }] },
      { name: "EQS", variants: [{ name: "EQS450+" }, { name: "EQS580" }, { name: "AMG EQS53" }] },
      { name: "EQE", variants: [{ name: "EQE350+" }, { name: "AMG EQE43" }, { name: "AMG EQE53" }] },
      { name: "EQA", variants: [{ name: "EQA250" }, { name: "EQA250+" }] },
      { name: "EQB", variants: [{ name: "EQB250" }, { name: "EQB350 4MATIC" }] },
    ],
  },
  {
    name: "Audi",
    models: [
      { name: "A4", variants: [{ name: "Premium" }, { name: "Premium Plus" }, { name: "Technology" }] },
      { name: "A6", variants: [{ name: "Premium Plus" }, { name: "Technology" }] },
      { name: "A8", variants: [{ name: "L" }, { name: "L Plus" }] },
      { name: "Q3", variants: [{ name: "Premium Plus" }, { name: "Technology" }, { name: "Sportback" }] },
      { name: "Q5", variants: [{ name: "Premium Plus" }, { name: "Technology" }] },
      { name: "Q7", variants: [{ name: "Premium Plus" }, { name: "Technology" }] },
      { name: "Q8", variants: [{ name: "Celebration" }, { name: "Technology" }] },
      { name: "e-tron", variants: [{ name: "50" }, { name: "55" }, { name: "S" }] },
      { name: "e-tron GT", variants: [{ name: "quattro" }, { name: "RS" }] },
      { name: "Q8 e-tron", variants: [{ name: "50" }, { name: "55" }, { name: "S" }] },
    ],
  },
  {
    name: "Volvo",
    models: [
      { name: "S60", variants: [{ name: "B5 Inscription" }] },
      { name: "S90", variants: [{ name: "B5 Inscription" }, { name: "B6 Ultimate" }] },
      { name: "XC40", variants: [{ name: "B4 Momentum" }, { name: "B4 R-Design" }, { name: "B4 Inscription" }] },
      { name: "XC40 Recharge", variants: [{ name: "P8 AWD" }] },
      { name: "XC60", variants: [{ name: "B5 Momentum" }, { name: "B5 Inscription" }, { name: "B6 Ultimate" }] },
      { name: "XC90", variants: [{ name: "B5 Inscription" }, { name: "B6 Ultimate" }, { name: "Recharge" }] },
      { name: "C40 Recharge", variants: [{ name: "Core" }, { name: "Plus" }, { name: "Ultimate" }] },
    ],
  },
  {
    name: "Lexus",
    models: [
      { name: "ES", variants: [{ name: "300h Exquisite" }, { name: "300h Luxury" }, { name: "300h Ultra Luxury" }] },
      { name: "LS", variants: [{ name: "500h Nishijin" }, { name: "500h Ultra Luxury" }] },
      { name: "NX", variants: [{ name: "350h Luxury" }, { name: "350h F-Sport" }] },
      { name: "RX", variants: [{ name: "350h Luxury" }, { name: "350h F-Sport" }, { name: "500h F-Sport" }] },
      { name: "LX", variants: [{ name: "500d" }] },
    ],
  },
  {
    name: "Land Rover",
    models: [
      { name: "Range Rover Evoque", variants: [{ name: "S" }, { name: "SE" }, { name: "HSE" }] },
      { name: "Range Rover Velar", variants: [{ name: "S" }, { name: "SE" }, { name: "R-Dynamic SE" }, { name: "R-Dynamic HSE" }] },
      { name: "Range Rover Sport", variants: [{ name: "SE" }, { name: "HSE" }, { name: "Autobiography" }, { name: "SV" }] },
      { name: "Range Rover", variants: [{ name: "SE" }, { name: "HSE" }, { name: "Autobiography" }, { name: "SV" }] },
      { name: "Discovery Sport", variants: [{ name: "S" }, { name: "SE" }, { name: "R-Dynamic SE" }] },
      { name: "Discovery", variants: [{ name: "S" }, { name: "SE" }, { name: "HSE" }] },
      { name: "Defender", variants: [{ name: "90" }, { name: "110" }, { name: "130" }, { name: "V8" }] },
    ],
  },
  {
    name: "Porsche",
    models: [
      { name: "Cayenne", variants: [{ name: "Base" }, { name: "S" }, { name: "GTS" }, { name: "Turbo" }, { name: "Turbo S" }] },
      { name: "Macan", variants: [{ name: "Base" }, { name: "S" }, { name: "GTS" }, { name: "Turbo" }] },
      { name: "Panamera", variants: [{ name: "Base" }, { name: "4S" }, { name: "Turbo" }, { name: "Turbo S" }] },
      { name: "Taycan", variants: [{ name: "Base" }, { name: "4S" }, { name: "Turbo" }, { name: "Turbo S" }] },
      { name: "911", variants: [{ name: "Carrera" }, { name: "Carrera S" }, { name: "Turbo" }, { name: "Turbo S" }, { name: "GT3" }] },
    ],
  },
  {
    name: "Citroen",
    models: [
      { name: "C3", variants: [{ name: "Live" }, { name: "Feel" }, { name: "Feel Vibe" }, { name: "Shine" }] },
      { name: "C3 Aircross", variants: [{ name: "Plus" }, { name: "Max" }] },
      { name: "eC3", variants: [{ name: "Live" }, { name: "Feel" }, { name: "Shine" }] },
      { name: "Basalt", variants: [{ name: "You" }, { name: "Plus" }, { name: "Max" }] },
    ],
  },
  {
    name: "BYD",
    models: [
      { name: "Atto 3", variants: [{ name: "Dynamic" }, { name: "Premium" }, { name: "Superior" }] },
      { name: "Seal", variants: [{ name: "Dynamic" }, { name: "Premium" }, { name: "Performance" }] },
      { name: "e6", variants: [{ name: "GL" }, { name: "GLX" }] },
    ],
  },
];

// Bike brands data
export const bikeBrands: VehicleBrand[] = [
  {
    name: "Hero",
    models: [
      { name: "Splendor Plus", variants: [{ name: "Kick Start" }, { name: "Self Start" }, { name: "i3S" }] },
      { name: "Splendor Pro", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "HF Deluxe", variants: [{ name: "Kick Start" }, { name: "Self Start" }, { name: "i3S" }] },
      { name: "Passion Pro", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Super Splendor", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Glamour", variants: [{ name: "Drum" }, { name: "Disc" }, { name: "Blaze" }] },
      { name: "Xtreme 160R", variants: [{ name: "Front Disc" }, { name: "Double Disc" }, { name: "Stealth" }] },
      { name: "Xpulse 200", variants: [{ name: "4V" }, { name: "4V Rally" }] },
      { name: "Karizma XMR", variants: [{ name: "Standard" }] },
      { name: "Destini 125", variants: [{ name: "LX" }, { name: "VX" }, { name: "ZX" }] },
      { name: "Pleasure Plus", variants: [{ name: "LX" }, { name: "VX" }] },
      { name: "Maestro Edge 125", variants: [{ name: "VX" }, { name: "ZX" }] },
      { name: "Xtreme 125R", variants: [{ name: "Standard" }] },
      { name: "Mavrick 440", variants: [{ name: "Base" }, { name: "Select" }, { name: "Tech" }] },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "Shine", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "SP 125", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Unicorn", variants: [{ name: "Standard" }] },
      { name: "Hornet 2.0", variants: [{ name: "Standard" }] },
      { name: "CB200X", variants: [{ name: "Standard" }] },
      { name: "CB300F", variants: [{ name: "Standard" }, { name: "DLX" }, { name: "DLX Pro" }] },
      { name: "CB300R", variants: [{ name: "Standard" }] },
      { name: "CB350", variants: [{ name: "DLX" }, { name: "DLX Pro" }, { name: "RS" }] },
      { name: "CB350 Brigade", variants: [{ name: "Standard" }] },
      { name: "Activa 6G", variants: [{ name: "STD" }, { name: "DLX" }] },
      { name: "Activa 125", variants: [{ name: "STD" }, { name: "DLX" }] },
      { name: "Dio", variants: [{ name: "STD" }, { name: "DLX" }] },
      { name: "Grazia", variants: [{ name: "STD" }, { name: "DLX" }] },
      { name: "Africa Twin", variants: [{ name: "Standard" }, { name: "Adventure Sports" }] },
      { name: "Gold Wing", variants: [{ name: "Tour" }] },
    ],
  },
  {
    name: "Bajaj",
    models: [
      { name: "Platina 100", variants: [{ name: "ES" }, { name: "Comfortec" }] },
      { name: "CT 110", variants: [{ name: "KS" }, { name: "ES" }] },
      { name: "Pulsar 125", variants: [{ name: "Drum" }, { name: "Disc" }, { name: "Split Seat" }] },
      { name: "Pulsar 150", variants: [{ name: "Standard" }, { name: "Neon" }, { name: "Twin Disc" }] },
      { name: "Pulsar N160", variants: [{ name: "Standard" }] },
      { name: "Pulsar NS200", variants: [{ name: "Standard" }] },
      { name: "Pulsar RS200", variants: [{ name: "Standard" }] },
      { name: "Pulsar N250", variants: [{ name: "Standard" }] },
      { name: "Pulsar F250", variants: [{ name: "Standard" }] },
      { name: "Pulsar NS400", variants: [{ name: "Standard" }] },
      { name: "Dominar 250", variants: [{ name: "Standard" }] },
      { name: "Dominar 400", variants: [{ name: "Standard" }] },
      { name: "Chetak", variants: [{ name: "Urbane" }, { name: "Premium" }] },
      { name: "Freedom 125", variants: [{ name: "Drum" }, { name: "Disc" }] },
    ],
  },
  {
    name: "TVS",
    models: [
      { name: "Sport", variants: [{ name: "Kick Start" }, { name: "Self Start" }] },
      { name: "Star City Plus", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Radeon", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Apache RTR 160", variants: [{ name: "2V" }, { name: "4V" }] },
      { name: "Apache RTR 180", variants: [{ name: "Standard" }] },
      { name: "Apache RTR 200 4V", variants: [{ name: "Standard" }, { name: "Race Edition" }] },
      { name: "Apache RR 310", variants: [{ name: "Standard" }, { name: "BTO" }] },
      { name: "Ronin", variants: [{ name: "SS" }, { name: "DS" }] },
      { name: "Jupiter", variants: [{ name: "STD" }, { name: "Classic" }, { name: "ZX" }] },
      { name: "Jupiter 125", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Ntorq 125", variants: [{ name: "Drum" }, { name: "Disc" }, { name: "Race XP" }] },
      { name: "iQube", variants: [{ name: "S" }, { name: "ST" }] },
      { name: "Raider 125", variants: [{ name: "Drum" }, { name: "Disc" }, { name: "SuperSquad" }] },
    ],
  },
  {
    name: "Royal Enfield",
    models: [
      { name: "Classic 350", variants: [{ name: "Halcyon" }, { name: "Signals" }, { name: "Dark" }, { name: "Chrome" }] },
      { name: "Bullet 350", variants: [{ name: "Standard" }, { name: "ES" }] },
      { name: "Meteor 350", variants: [{ name: "Fireball" }, { name: "Stellar" }, { name: "Supernova" }] },
      { name: "Hunter 350", variants: [{ name: "Retro" }, { name: "Metro" }] },
      { name: "Himalayan", variants: [{ name: "Base" }, { name: "Sleet" }, { name: "Granite" }] },
      { name: "Himalayan 450", variants: [{ name: "Base" }, { name: "Kaza Brown" }, { name: "Slate Himalayan Salt" }] },
      { name: "Scram 411", variants: [{ name: "Standard" }] },
      { name: "Continental GT 650", variants: [{ name: "Standard" }] },
      { name: "Interceptor 650", variants: [{ name: "Standard" }] },
      { name: "Super Meteor 650", variants: [{ name: "Astral" }, { name: "Interstellar" }, { name: "Celestial" }] },
      { name: "Shotgun 650", variants: [{ name: "Standard" }] },
      { name: "Guerrilla 450", variants: [{ name: "Analogue" }, { name: "Dash" }, { name: "Flash" }] },
      { name: "Bear 650", variants: [{ name: "Standard" }] },
    ],
  },
  {
    name: "Yamaha",
    models: [
      { name: "FZ-S Fi", variants: [{ name: "V3" }, { name: "V4" }, { name: "Deluxe" }] },
      { name: "FZ-X", variants: [{ name: "Standard" }, { name: "Chrome" }] },
      { name: "MT-15", variants: [{ name: "V2" }] },
      { name: "R15", variants: [{ name: "V4" }, { name: "M" }] },
      { name: "R15S", variants: [{ name: "Standard" }] },
      { name: "Fascino 125", variants: [{ name: "Drum" }, { name: "Disc" }] },
      { name: "Ray ZR 125", variants: [{ name: "Drum" }, { name: "Disc" }, { name: "Street Rally" }] },
      { name: "Aerox 155", variants: [{ name: "Standard" }, { name: "MotoGP" }] },
      { name: "FZ 25", variants: [{ name: "Standard" }] },
      { name: "MT-03", variants: [{ name: "Standard" }] },
      { name: "R3", variants: [{ name: "Standard" }] },
    ],
  },
  {
    name: "Suzuki",
    models: [
      { name: "Gixxer SF", variants: [{ name: "Standard" }] },
      { name: "Gixxer 250", variants: [{ name: "Standard" }] },
      { name: "Gixxer SF 250", variants: [{ name: "Standard" }] },
      { name: "V-Strom SX", variants: [{ name: "Standard" }] },
      { name: "Hayabusa", variants: [{ name: "Standard" }] },
      { name: "Access 125", variants: [{ name: "Drum" }, { name: "Disc" }, { name: "SE" }] },
      { name: "Burgman Street", variants: [{ name: "Standard" }, { name: "EX" }] },
      { name: "Avenis", variants: [{ name: "Standard" }, { name: "Race Edition" }] },
      { name: "Intruder", variants: [{ name: "Standard" }] },
    ],
  },
  {
    name: "KTM",
    models: [
      { name: "125 Duke", variants: [{ name: "Standard" }] },
      { name: "200 Duke", variants: [{ name: "Standard" }] },
      { name: "250 Duke", variants: [{ name: "Standard" }] },
      { name: "390 Duke", variants: [{ name: "Standard" }] },
      { name: "RC 125", variants: [{ name: "Standard" }] },
      { name: "RC 200", variants: [{ name: "Standard" }] },
      { name: "RC 390", variants: [{ name: "Standard" }] },
      { name: "250 Adventure", variants: [{ name: "Standard" }] },
      { name: "390 Adventure", variants: [{ name: "Standard" }, { name: "X" }] },
      { name: "890 Duke", variants: [{ name: "Standard" }, { name: "R" }] },
      { name: "1390 Super Duke R", variants: [{ name: "Standard" }, { name: "EVO" }] },
    ],
  },
  {
    name: "Kawasaki",
    models: [
      { name: "Ninja 300", variants: [{ name: "Standard" }] },
      { name: "Ninja 400", variants: [{ name: "Standard" }] },
      { name: "Ninja 650", variants: [{ name: "Standard" }] },
      { name: "Ninja ZX-4R", variants: [{ name: "Standard" }, { name: "SE" }] },
      { name: "Ninja ZX-6R", variants: [{ name: "Standard" }] },
      { name: "Ninja ZX-10R", variants: [{ name: "Standard" }] },
      { name: "Z650", variants: [{ name: "Standard" }] },
      { name: "Z900", variants: [{ name: "Standard" }] },
      { name: "Versys 650", variants: [{ name: "Standard" }] },
      { name: "Vulcan S", variants: [{ name: "Standard" }] },
      { name: "W800", variants: [{ name: "Street" }, { name: "Cafe" }] },
    ],
  },
  {
    name: "Harley-Davidson",
    models: [
      { name: "X440", variants: [{ name: "Denim" }, { name: "Vivid" }, { name: "S" }] },
      { name: "Nightster", variants: [{ name: "Standard" }, { name: "Special" }] },
      { name: "Sportster S", variants: [{ name: "Standard" }] },
      { name: "Fat Boy", variants: [{ name: "Standard" }, { name: "114" }] },
      { name: "Fat Bob", variants: [{ name: "Standard" }, { name: "114" }] },
      { name: "Road Glide", variants: [{ name: "Standard" }, { name: "Special" }] },
      { name: "Road King", variants: [{ name: "Standard" }, { name: "Special" }] },
      { name: "Pan America", variants: [{ name: "1250" }, { name: "1250 Special" }] },
      { name: "Street Glide", variants: [{ name: "Standard" }, { name: "Special" }] },
      { name: "Low Rider", variants: [{ name: "S" }, { name: "ST" }] },
    ],
  },
  {
    name: "Triumph",
    models: [
      { name: "Speed 400", variants: [{ name: "Standard" }] },
      { name: "Scrambler 400 X", variants: [{ name: "Standard" }] },
      { name: "Trident 660", variants: [{ name: "Standard" }] },
      { name: "Street Triple", variants: [{ name: "R" }, { name: "RS" }] },
      { name: "Speed Triple", variants: [{ name: "1200 RS" }, { name: "1200 RR" }] },
      { name: "Tiger Sport 660", variants: [{ name: "Standard" }] },
      { name: "Tiger 900", variants: [{ name: "GT" }, { name: "Rally" }] },
      { name: "Tiger 1200", variants: [{ name: "GT" }, { name: "Rally" }] },
      { name: "Bonneville", variants: [{ name: "T100" }, { name: "T120" }, { name: "Bobber" }, { name: "Speedmaster" }] },
      { name: "Rocket 3", variants: [{ name: "R" }, { name: "GT" }] },
      { name: "Speed Twin 900", variants: [{ name: "Standard" }] },
    ],
  },
  {
    name: "Jawa",
    models: [
      { name: "Jawa", variants: [{ name: "Standard" }, { name: "Dual Tone" }] },
      { name: "Jawa 42", variants: [{ name: "Standard" }, { name: "Bobber" }] },
      { name: "Jawa 350", variants: [{ name: "Standard" }] },
      { name: "Yezdi Roadster", variants: [{ name: "Standard" }] },
      { name: "Yezdi Scrambler", variants: [{ name: "Standard" }] },
      { name: "Yezdi Adventure", variants: [{ name: "Standard" }] },
    ],
  },
  {
    name: "Ather",
    models: [
      { name: "450X", variants: [{ name: "Standard" }, { name: "Pro Pack" }] },
      { name: "450 Apex", variants: [{ name: "Standard" }] },
      { name: "Rizta", variants: [{ name: "S" }, { name: "Z" }] },
    ],
  },
  {
    name: "Ola",
    models: [
      { name: "S1 Pro", variants: [{ name: "Standard" }] },
      { name: "S1 Air", variants: [{ name: "Standard" }] },
      { name: "S1 X", variants: [{ name: "2kWh" }, { name: "3kWh" }, { name: "4kWh" }] },
      { name: "Roadster", variants: [{ name: "Base" }, { name: "X" }, { name: "Pro" }] },
    ],
  },
  {
    name: "BMW Motorrad",
    models: [
      { name: "G 310 R", variants: [{ name: "Standard" }] },
      { name: "G 310 GS", variants: [{ name: "Standard" }] },
      { name: "F 850 GS", variants: [{ name: "Standard" }, { name: "Adventure" }] },
      { name: "R 1250 GS", variants: [{ name: "Standard" }, { name: "Adventure" }] },
      { name: "S 1000 RR", variants: [{ name: "Standard" }, { name: "M Package" }] },
      { name: "S 1000 R", variants: [{ name: "Standard" }] },
      { name: "M 1000 RR", variants: [{ name: "Standard" }] },
    ],
  },
  {
    name: "Ducati",
    models: [
      { name: "Scrambler", variants: [{ name: "Icon" }, { name: "Full Throttle" }, { name: "Nightshift" }] },
      { name: "Monster", variants: [{ name: "Standard" }, { name: "SP" }] },
      { name: "Panigale V2", variants: [{ name: "Standard" }, { name: "Bayliss" }] },
      { name: "Panigale V4", variants: [{ name: "Standard" }, { name: "S" }, { name: "SP2" }, { name: "R" }] },
      { name: "Multistrada V4", variants: [{ name: "Standard" }, { name: "S" }, { name: "Rally" }] },
      { name: "Diavel", variants: [{ name: "V4" }] },
      { name: "Streetfighter V4", variants: [{ name: "Standard" }, { name: "S" }, { name: "SP" }] },
      { name: "DesertX", variants: [{ name: "Standard" }, { name: "Discovery" }, { name: "Rally" }] },
    ],
  },
];

// Commercial vehicle brands
export const commercialBrands: VehicleBrand[] = [
  {
    name: "Tata",
    models: [
      { name: "Ace", variants: [{ name: "Mega" }, { name: "Gold" }, { name: "Gold Plus" }, { name: "EV" }] },
      { name: "Intra", variants: [{ name: "V10" }, { name: "V20" }, { name: "V30" }, { name: "V50" }] },
      { name: "Yodha", variants: [{ name: "2.0" }, { name: "Pickup" }] },
      { name: "Winger", variants: [{ name: "9 Seater" }, { name: "12 Seater" }, { name: "15 Seater" }] },
      { name: "Magic", variants: [{ name: "Express" }, { name: "Mantra" }] },
      { name: "407", variants: [{ name: "SFC" }, { name: "LPT" }] },
      { name: "709", variants: [{ name: "SFC" }, { name: "LPT" }] },
      { name: "1109", variants: [{ name: "SFC" }, { name: "LPT" }] },
      { name: "Ultra", variants: [{ name: "1014" }, { name: "1518" }, { name: "1918" }] },
    ],
  },
  {
    name: "Mahindra",
    models: [
      { name: "Bolero Pickup", variants: [{ name: "City" }, { name: "Maxi Truck" }, { name: "FB" }] },
      { name: "Supro", variants: [{ name: "Van" }, { name: "Minitruck" }, { name: "Maxi" }] },
      { name: "Jeeto", variants: [{ name: "Plus" }, { name: "Strong" }] },
      { name: "Alfa", variants: [{ name: "DX" }, { name: "Load" }] },
      { name: "Furio", variants: [{ name: "7" }, { name: "12" }] },
      { name: "Blazo", variants: [{ name: "X 25" }, { name: "X 35" }, { name: "X 49" }] },
    ],
  },
  {
    name: "Ashok Leyland",
    models: [
      { name: "Dost", variants: [{ name: "Lite" }, { name: "Strong" }, { name: "Plus" }, { name: "CNG" }] },
      { name: "Partner", variants: [{ name: "4 Tyre" }, { name: "6 Tyre" }] },
      { name: "Bada Dost", variants: [{ name: "i2" }, { name: "i3" }, { name: "i4" }] },
      { name: "Ecomet", variants: [{ name: "1015" }, { name: "1214" }, { name: "1415" }] },
      { name: "Boss", variants: [{ name: "1214" }, { name: "1415" }, { name: "1616" }] },
    ],
  },
  {
    name: "Force",
    models: [
      { name: "Traveller", variants: [{ name: "3050" }, { name: "3350" }, { name: "3700" }] },
      { name: "Trax", variants: [{ name: "Cruiser" }, { name: "Toofan" }] },
      { name: "Gurkha", variants: [{ name: "4x4" }, { name: "5-Door" }] },
      { name: "Urbania", variants: [{ name: "10 Seater" }, { name: "13 Seater" }, { name: "17 Seater" }] },
    ],
  },
  {
    name: "Maruti Suzuki",
    models: [
      { name: "Eeco", variants: [{ name: "Cargo" }, { name: "5 Seater" }, { name: "7 Seater" }] },
      { name: "Super Carry", variants: [{ name: "Standard" }, { name: "CNG" }] },
    ],
  },
  {
    name: "Piaggio",
    models: [
      { name: "Ape", variants: [{ name: "Xtra" }, { name: "Xtra LDX" }, { name: "Auto" }] },
      { name: "Porter", variants: [{ name: "700" }, { name: "1000" }] },
    ],
  },
  {
    name: "Isuzu",
    models: [
      { name: "D-Max", variants: [{ name: "Regular Cab" }, { name: "S-Cab" }, { name: "Hi-Lander" }, { name: "V-Cross" }] },
      { name: "MU-X", variants: [{ name: "4x2" }, { name: "4x4" }] },
    ],
  },
  {
  name: "Eicher",
  models: [
    { name: "Pro 1049", variants: [{ name: "Truck" }] },
    { name: "Pro 2049", variants: [{ name: "Truck" }] },
    { name: "Pro 3015", variants: [{ name: "Truck" }] },
  ],
},
{
  name: "BharatBenz",
  models: [
    { name: "1217", variants: [{ name: "Truck" }] },
    { name: "1617", variants: [{ name: "Truck" }] },
    { name: "2823", variants: [{ name: "Truck" }] },
  ],
}];


// Extended Color options (65+ colors)
export const vehicleColors = [
  // Whites & Creams
  { name: "White", code: "#FFFFFF" },
  { name: "Pearl White", code: "#F8F6F0" },
  { name: "Arctic White", code: "#E8E8E8" },
  { name: "Ivory", code: "#FFFFF0" },
  { name: "Cream", code: "#FFFDD0" },
  { name: "Champagne", code: "#F7E7CE" },
  { name: "Polar White", code: "#F0F0F0" },
  { name: "Snow White", code: "#FFFAFA" },
  
  // Blacks & Dark
  { name: "Black", code: "#000000" },
  { name: "Midnight Black", code: "#191970" },
  { name: "Matte Black", code: "#1C1C1C" },
  { name: "Jet Black", code: "#0A0A0A" },
  { name: "Piano Black", code: "#0C0C0C" },
  { name: "Carbon Black", code: "#1A1A1A" },
  
  // Greys & Silvers
  { name: "Silver", code: "#C0C0C0" },
  { name: "Grey", code: "#808080" },
  { name: "Charcoal", code: "#36454F" },
  { name: "Graphite Grey", code: "#474A51" },
  { name: "Titanium Grey", code: "#878681" },
  { name: "Matte Grey", code: "#6E6E6E" },
  { name: "Chrome Silver", code: "#DFE0E2" },
  { name: "Gun Metal", code: "#2A3439" },
  { name: "Moonlight Silver", code: "#D4D4D4" },
  { name: "Platinum Grey", code: "#A5A5A5" },
  
  // Reds
  { name: "Red", code: "#FF0000" },
  { name: "Maroon", code: "#800000" },
  { name: "Wine Red", code: "#722F37" },
  { name: "Racing Red", code: "#D40000" },
  { name: "Candy Red", code: "#FF0800" },
  { name: "Burgundy", code: "#800020" },
  { name: "Ruby Red", code: "#9B111E" },
  { name: "Sunset Orange", code: "#FF5E00" },
  { name: "Flame Red", code: "#E25822" },
  { name: "Coral Red", code: "#FF6B6B" },
  
  // Blues
  { name: "Blue", code: "#0000FF" },
  { name: "Navy Blue", code: "#000080" },
  { name: "Royal Blue", code: "#4169E1" },
  { name: "Sky Blue", code: "#87CEEB" },
  { name: "Electric Blue", code: "#007FFF" },
  { name: "Midnight Blue", code: "#003366" },
  { name: "Sapphire Blue", code: "#0F52BA" },
  { name: "Cobalt Blue", code: "#0047AB" },
  { name: "Azure Blue", code: "#007FFF" },
  { name: "Ocean Blue", code: "#4F42B5" },
  { name: "Pacific Blue", code: "#1CA9C9" },
  
  // Greens
  { name: "Green", code: "#008000" },
  { name: "Dark Green", code: "#006400" },
  { name: "Olive", code: "#808000" },
  { name: "Forest Green", code: "#228B22" },
  { name: "Neon Green", code: "#39FF14" },
  { name: "Teal", code: "#008080" },
  { name: "British Racing Green", code: "#004225" },
  { name: "Lime Green", code: "#32CD32" },
  { name: "Army Green", code: "#4B5320" },
  { name: "Mint Green", code: "#98FF98" },
  
  // Yellows & Golds
  { name: "Yellow", code: "#FFFF00" },
  { name: "Gold", code: "#FFD700" },
  { name: "Bronze", code: "#CD7F32" },
  { name: "Copper", code: "#B87333" },
  { name: "Beige", code: "#F5F5DC" },
  { name: "Sand", code: "#C2B280" },
  { name: "Mustard Yellow", code: "#FFDB58" },
  { name: "Sunflower Yellow", code: "#FFDA03" },
  
  // Oranges
  { name: "Orange", code: "#FFA500" },
  { name: "Tangerine", code: "#FF9966" },
  { name: "Burnt Orange", code: "#CC5500" },
  { name: "Coral", code: "#FF7F50" },
  { name: "Peach", code: "#FFCBA4" },
  
  // Browns
  { name: "Brown", code: "#8B4513" },
  { name: "Mahogany", code: "#C04000" },
  { name: "Espresso", code: "#3C2415" },
  { name: "Mocha", code: "#967969" },
  { name: "Caramel", code: "#FFD59A" },
  { name: "Coffee Brown", code: "#4B3621" },
  
  // Purples & Pinks
  { name: "Purple", code: "#800080" },
  { name: "Violet", code: "#8B00FF" },
  { name: "Magenta", code: "#FF00FF" },
  { name: "Turquoise", code: "#40E0D0" },
  { name: "Lavender", code: "#E6E6FA" },
  { name: "Pink", code: "#FFC0CB" },
  { name: "Rose Pink", code: "#FF66B2" },
  { name: "Plum", code: "#8E4585" },
  { name: "Deep Purple", code: "#673AB7" },
  
  // Special Finishes
  { name: "Pearl Black", code: "#0D0D0D" },
  { name: "Metallic Blue", code: "#4682B4" },
  { name: "Metallic Red", code: "#A52A2A" },
  { name: "Metallic Green", code: "#2E8B57" },
  { name: "Satin Silver", code: "#B8B8B8" },
  { name: "Rose Gold", code: "#B76E79" },
];

// Helper functions
export const getBrandsForType = (vehicleType: string): VehicleBrand[] => {
  switch (vehicleType) {
    case 'car':
      return carBrands;
    case 'bike':
      return bikeBrands;
    case 'commercial':
      return commercialBrands;
    default:
      return carBrands;
  }
};

export const getModelsForBrand = (vehicleType: string, brandName: string): VehicleModel[] => {
  const brands = getBrandsForType(vehicleType);
  const brand = brands.find(b => b.name === brandName);
  return brand?.models || [];
};

export const getVariantsForModel = (vehicleType: string, brandName: string, modelName: string): VehicleVariant[] => {
  const models = getModelsForBrand(vehicleType, brandName);
  const model = models.find(m => m.name === modelName);
  return model?.variants || [];
};
