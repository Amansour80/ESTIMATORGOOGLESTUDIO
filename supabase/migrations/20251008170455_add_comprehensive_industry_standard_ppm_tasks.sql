/*
  # Add Comprehensive Industry Standard PPM Tasks to All Assets

  This migration adds industry-standard PPM (Planned Preventive Maintenance) tasks 
  based on SFG20 and CIBSE guidelines for all assets in the industry standard library.

  ## PPM Tasks Added By Category:

  ### BMS (Building Management System)
  - BMS Server/Controller, Workstation: Regular checks, backups, software updates
  - DDC Controllers: Calibration, functional tests
  - Sensors: Calibration and accuracy checks
  - Control Actuators: Operational tests and lubrication

  ### Electrical
  - MDB/Sub Distribution Boards: Visual inspection, thermographic testing, connections check
  - Transformers: Oil testing, insulation tests, cooling system checks
  - UPS Systems: Battery tests, load tests, component checks
  - Emergency Lighting: Function tests, battery tests, illumination checks
  - Lighting Fixtures: Cleaning, lamp replacement
  - Power Sockets: Testing and visual inspection
  - Earthing System: Resistance tests
  - Surge Protection: Functionality tests

  ### Fire Safety
  - Fire Alarm Panels: Full system tests, detector tests, battery checks
  - Smoke/Heat Detectors: Functional tests, sensitivity checks
  - Manual Call Points: Operation tests
  - Fire Pumps: Weekly runs, performance tests, maintenance
  - Sprinkler Systems: Flow tests, valve checks, pressure tests
  - Fire Hose Reels: Visual inspection, flow tests
  - Fire Extinguishers: Inspection, pressure checks
  - Dry Risers: Pressure tests, valve checks
  - Emergency Voice Alarm: Testing and inspection

  ### HVAC
  - AHUs: Filter changes, motor checks, belt checks, coil cleaning
  - Chillers: Performance monitoring, refrigerant checks, oil analysis
  - FCUs: Filter cleaning, coil cleaning, drain checks
  - Package Units: Filter replacement, coil cleaning, refrigerant checks
  - VRF Systems: Refrigerant checks, controller checks, filter cleaning
  - Condensing Units: Coil cleaning, refrigerant checks
  - Exhaust Fans: Motor checks, belt inspection
  - Fire Dampers: Operation tests
  - Air Diffusers/Grilles: Cleaning
  - BMS Controls: Calibration and testing

  ### Lifts
  - Passenger/Service Lifts: Safety tests, motor checks, brake tests
  - Escalators: Safety device tests, chain lubrication, brake tests
  - Platform Lifts: Safety inspections, operational tests
  - Travelators: Safety checks, belt inspection, brake tests

  ### Plumbing
  - Water Pumps: Performance tests, motor checks, seal inspection
  - Water Storage Tanks: Cleaning, water quality tests, structural inspection
  - Water Heaters: Temperature checks, safety valve tests, element inspection
  - Drainage Systems: Flow tests, CCTV inspection, cleaning
  - Grease Traps: Cleaning and inspection
  - Sump Pumps: Function tests, float switch checks
  - Pressure Reducing Valves: Adjustment and testing
  - Thermostatic Mixing Valves: Temperature calibration
  - WC/Toilet: Leak checks, flush mechanism checks
  - Washbasins: Tap and waste checks

  ### Security
  - CCTV Cameras: Cleaning, alignment, focus checks
  - DVR/NVR: Storage checks, backup verification
  - Access Control: Card reader tests, panel checks, database backup
  - Intrusion Alarms: Sensor tests, battery checks, communication tests
  - PIR Detectors: Sensitivity checks, coverage tests
  - Magnetic Door Contacts: Operation tests
  - Turnstiles/Vehicle Barriers: Mechanism checks, safety tests
*/

-- BMS Assets
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual Inspection of System Status and Alarms', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'BMS-01'
UNION ALL
SELECT id, 'Database Backup Verification', 'monthly', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'BMS-01'
UNION ALL
SELECT id, 'Software Update and Patch Management', 'quarterly', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'BMS-01'
UNION ALL
SELECT id, 'Full System Health Check and Performance Review', 'semiannual', 3, 4
FROM industry_standard_asset_library WHERE standard_code = 'BMS-01'
UNION ALL
SELECT id, 'Disaster Recovery Test', 'annual', 4, 5
FROM industry_standard_asset_library WHERE standard_code = 'BMS-01'

UNION ALL
SELECT id, 'Workstation Software Updates', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'BMS-02'
UNION ALL
SELECT id, 'Hardware Cleaning and Inspection', 'semiannual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'BMS-02'
UNION ALL
SELECT id, 'User Access Rights Review', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'BMS-02'

UNION ALL
SELECT id, 'Functional Test and Calibration Check', 'quarterly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'DDC-01'
UNION ALL
SELECT id, 'Battery Backup Test', 'semiannual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'DDC-01'
UNION ALL
SELECT id, 'Firmware Update and Full System Test', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'DDC-01'

UNION ALL
SELECT id, 'Calibration and Accuracy Check', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'SENSOR-01'
UNION ALL
SELECT id, 'Wiring and Connection Inspection', 'semiannual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'SENSOR-01'

UNION ALL
SELECT id, 'Calibration and Accuracy Check', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'SENSOR-02'
UNION ALL
SELECT id, 'Sensor Cleaning and Connection Check', 'semiannual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'SENSOR-02'

UNION ALL
SELECT id, 'Calibration and Zero/Span Check', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'SENSOR-03'
UNION ALL
SELECT id, 'Leak Detection and Connection Inspection', 'semiannual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'SENSOR-03'

UNION ALL
SELECT id, 'Operation Test and Stroke Time Check', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'ACT-01'
UNION ALL
SELECT id, 'Lubrication and Mechanical Inspection', 'semiannual', 0.75, 2
FROM industry_standard_asset_library WHERE standard_code = 'ACT-01'
UNION ALL
SELECT id, 'Linkage Adjustment and Full Calibration', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'ACT-01';

-- Electrical Assets
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual Inspection and Tightness Check', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'SDB-01'
UNION ALL
SELECT id, 'Thermographic Survey', 'quarterly', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'SDB-01'
UNION ALL
SELECT id, 'Connection Torque Check and Cleaning', 'semiannual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'SDB-01'
UNION ALL
SELECT id, 'Insulation Resistance Test', 'annual', 1, 4
FROM industry_standard_asset_library WHERE standard_code = 'SDB-01'

UNION ALL
SELECT id, 'Oil Level and Temperature Check', 'monthly', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'XFMR-01'
UNION ALL
SELECT id, 'Thermographic Survey', 'quarterly', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'XFMR-01'
UNION ALL
SELECT id, 'Oil Analysis and Quality Test', 'semiannual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'XFMR-01'
UNION ALL
SELECT id, 'Insulation Resistance and Turns Ratio Test', 'annual', 3, 4
FROM industry_standard_asset_library WHERE standard_code = 'XFMR-01'
UNION ALL
SELECT id, 'Cooling System Inspection and Cleaning', 'annual', 2, 5
FROM industry_standard_asset_library WHERE standard_code = 'XFMR-01'

UNION ALL
SELECT id, 'Battery Voltage and Alarm Test', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'UPS-01'
UNION ALL
SELECT id, 'Load Bank Test', 'quarterly', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'UPS-01'
UNION ALL
SELECT id, 'Battery Discharge Test', 'semiannual', 3, 3
FROM industry_standard_asset_library WHERE standard_code = 'UPS-01'
UNION ALL
SELECT id, 'Capacitor and Fan Inspection', 'annual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'UPS-01'
UNION ALL
SELECT id, 'Battery Replacement', 'annual', 4, 5
FROM industry_standard_asset_library WHERE standard_code = 'UPS-01'

UNION ALL
SELECT id, 'Function Test and Duration Check', 'monthly', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'EMER-01'
UNION ALL
SELECT id, 'Battery Discharge Test', 'semiannual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'EMER-01'
UNION ALL
SELECT id, 'Illumination Level Test', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'EMER-01'
UNION ALL
SELECT id, 'Battery Replacement', 'annual', 0.5, 4
FROM industry_standard_asset_library WHERE standard_code = 'EMER-01'

UNION ALL
SELECT id, 'Visual Inspection and Cleaning', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'LTG-01'
UNION ALL
SELECT id, 'Lamp and Ballast Replacement', 'semiannual', 0.75, 2
FROM industry_standard_asset_library WHERE standard_code = 'LTG-01'
UNION ALL
SELECT id, 'Electrical Connection Check', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'LTG-01'

UNION ALL
SELECT id, 'Visual Inspection and Operational Test', 'semiannual', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'PWR-01'
UNION ALL
SELECT id, 'Electrical Safety Test (PAT)', 'annual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'PWR-01'

UNION ALL
SELECT id, 'Earth Resistance Test', 'semiannual', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'EARTH-01'
UNION ALL
SELECT id, 'Visual Inspection of Earth Connections', 'annual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'EARTH-01'
UNION ALL
SELECT id, 'Soil Resistivity Test', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'EARTH-01'

UNION ALL
SELECT id, 'Visual Inspection and Status Check', 'semiannual', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'SURGE-01'
UNION ALL
SELECT id, 'Surge Protection Device Test', 'annual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'SURGE-01'
UNION ALL
SELECT id, 'Device Replacement if Failed', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'SURGE-01';

-- Fire Safety Assets (remaining ones)
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Weekly Running Test', 'weekly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'FP-01'
UNION ALL
SELECT id, 'Monthly Full Load Test', 'monthly', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'FP-01'
UNION ALL
SELECT id, 'Quarterly Performance and Flow Test', 'quarterly', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'FP-01'
UNION ALL
SELECT id, 'Semiannual Mechanical Inspection', 'semiannual', 3, 4
FROM industry_standard_asset_library WHERE standard_code = 'FP-01'
UNION ALL
SELECT id, 'Annual Overhaul and Seal Replacement', 'annual', 6, 5
FROM industry_standard_asset_library WHERE standard_code = 'FP-01'

UNION ALL
SELECT id, 'Functional Smoke Test', 'semiannual', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'SMOKE-01'
UNION ALL
SELECT id, 'Sensitivity and Alarm Test', 'annual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'SMOKE-01'
UNION ALL
SELECT id, 'Cleaning and Full Functional Test', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'SMOKE-01'

UNION ALL
SELECT id, 'Functional Test', 'semiannual', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'HEAT-01'
UNION ALL
SELECT id, 'Sensitivity and Alarm Test', 'annual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'HEAT-01'
UNION ALL
SELECT id, 'Cleaning and Full Functional Test', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'HEAT-01'

UNION ALL
SELECT id, 'Operation Test', 'semiannual', 0.15, 1
FROM industry_standard_asset_library WHERE standard_code = 'MCP-01'
UNION ALL
SELECT id, 'Glass Replacement Check', 'annual', 0.15, 2
FROM industry_standard_asset_library WHERE standard_code = 'MCP-01'

UNION ALL
SELECT id, 'Visual Inspection and Flow Test', 'semiannual', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'HOSE-01'
UNION ALL
SELECT id, 'Hose Pressure Test', 'annual', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'HOSE-01'
UNION ALL
SELECT id, 'Hose Replacement', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'HOSE-01'

UNION ALL
SELECT id, 'Quarterly Visual Inspection', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'SPRNK-01'
UNION ALL
SELECT id, 'Semiannual Flow and Alarm Test', 'semiannual', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'SPRNK-01'
UNION ALL
SELECT id, 'Annual Full System Test', 'annual', 4, 3
FROM industry_standard_asset_library WHERE standard_code = 'SPRNK-01'
UNION ALL
SELECT id, 'Annual Sprinkler Head Inspection', 'annual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'SPRNK-01'

UNION ALL
SELECT id, 'Semiannual Pressure Test', 'semiannual', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'DRY-01'
UNION ALL
SELECT id, 'Annual Valve and Outlet Inspection', 'annual', 1.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'DRY-01'
UNION ALL
SELECT id, 'Annual Full Pressure Test with Fire Service', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'DRY-01'

UNION ALL
SELECT id, 'Monthly Sound Level Test', 'monthly', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'EM-01'
UNION ALL
SELECT id, 'Semiannual Microphone and Speaker Test', 'semiannual', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'EM-01'
UNION ALL
SELECT id, 'Annual Full System Test and Coverage Check', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'EM-01';

-- HVAC Assets (remaining ones)
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Monthly Filter Check and Replacement', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'FCU-01'
UNION ALL
SELECT id, 'Quarterly Coil Cleaning', 'quarterly', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'FCU-01'
UNION ALL
SELECT id, 'Semiannual Fan Motor and Bearing Check', 'semiannual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'FCU-01'
UNION ALL
SELECT id, 'Annual Drain Pan Cleaning and Leak Test', 'annual', 1, 4
FROM industry_standard_asset_library WHERE standard_code = 'FCU-01'

UNION ALL
SELECT id, 'Monthly Filter Replacement', 'monthly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'PKG-01'
UNION ALL
SELECT id, 'Quarterly Coil Cleaning', 'quarterly', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'PKG-01'
UNION ALL
SELECT id, 'Quarterly Refrigerant Level Check', 'quarterly', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'PKG-01'
UNION ALL
SELECT id, 'Semiannual Electrical Connection Check', 'semiannual', 1.5, 4
FROM industry_standard_asset_library WHERE standard_code = 'PKG-01'
UNION ALL
SELECT id, 'Annual Compressor and Fan Motor Service', 'annual', 3, 5
FROM industry_standard_asset_library WHERE standard_code = 'PKG-01'

UNION ALL
SELECT id, 'Monthly Filter Cleaning (Indoor Units)', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'VRF-01'
UNION ALL
SELECT id, 'Quarterly Outdoor Unit Coil Cleaning', 'quarterly', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'VRF-01'
UNION ALL
SELECT id, 'Quarterly Refrigerant Pressure Check', 'quarterly', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'VRF-01'
UNION ALL
SELECT id, 'Semiannual Controller and Sensor Check', 'semiannual', 1.5, 4
FROM industry_standard_asset_library WHERE standard_code = 'VRF-01'
UNION ALL
SELECT id, 'Annual System Performance Test', 'annual', 3, 5
FROM industry_standard_asset_library WHERE standard_code = 'VRF-01'

UNION ALL
SELECT id, 'Quarterly Coil Cleaning', 'quarterly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'CU-01'
UNION ALL
SELECT id, 'Quarterly Refrigerant Level and Leak Check', 'quarterly', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'CU-01'
UNION ALL
SELECT id, 'Semiannual Fan Motor and Blade Inspection', 'semiannual', 1.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'CU-01'
UNION ALL
SELECT id, 'Annual Compressor Oil Analysis', 'annual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'CU-01'

UNION ALL
SELECT id, 'Quarterly Visual and Vibration Check', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'EXH-01'
UNION ALL
SELECT id, 'Semiannual Belt Tension and Alignment Check', 'semiannual', 0.75, 2
FROM industry_standard_asset_library WHERE standard_code = 'EXH-01'
UNION ALL
SELECT id, 'Annual Motor Bearing Lubrication', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'EXH-01'
UNION ALL
SELECT id, 'Annual Fan Blade Cleaning and Balance Check', 'annual', 1.5, 4
FROM industry_standard_asset_library WHERE standard_code = 'EXH-01'

UNION ALL
SELECT id, 'Semiannual Operation Test', 'semiannual', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'DAMP-01'
UNION ALL
SELECT id, 'Annual Full Function and Seal Inspection', 'annual', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'DAMP-01'

UNION ALL
SELECT id, 'Quarterly Cleaning', 'quarterly', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'DIFF-01'
UNION ALL
SELECT id, 'Annual Adjustment and Alignment', 'annual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'DIFF-01'

UNION ALL
SELECT id, 'Quarterly Setpoint Verification', 'quarterly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'BMS-HV'
UNION ALL
SELECT id, 'Semiannual Sensor Calibration', 'semiannual', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'BMS-HV'
UNION ALL
SELECT id, 'Annual Full System Optimization', 'annual', 4, 3
FROM industry_standard_asset_library WHERE standard_code = 'BMS-HV';

-- Lifts (remaining ones)
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Monthly Safety Device Test', 'monthly', 2, 1
FROM industry_standard_asset_library WHERE standard_code = 'ESC-01'
UNION ALL
SELECT id, 'Monthly Chain and Drive Lubrication', 'monthly', 1.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'ESC-01'
UNION ALL
SELECT id, 'Quarterly Brake and Safety System Test', 'quarterly', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'ESC-01'
UNION ALL
SELECT id, 'Semiannual Step and Comb Plate Inspection', 'semiannual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'ESC-01'
UNION ALL
SELECT id, 'Annual Full Service and Chain Tensioning', 'annual', 4, 5
FROM industry_standard_asset_library WHERE standard_code = 'ESC-01'

UNION ALL
SELECT id, 'Monthly Safety Test', 'monthly', 1.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'LIFT-02'
UNION ALL
SELECT id, 'Quarterly Load Test and Guide Rail Inspection', 'quarterly', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'LIFT-02'
UNION ALL
SELECT id, 'Annual Thorough Examination (LOLER)', 'annual', 3, 3
FROM industry_standard_asset_library WHERE standard_code = 'LIFT-02'

UNION ALL
SELECT id, 'Monthly Safety and Operation Test', 'monthly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'PLAT-01'
UNION ALL
SELECT id, 'Quarterly Safety Device and Limit Switch Test', 'quarterly', 1.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'PLAT-01'
UNION ALL
SELECT id, 'Annual Thorough Examination (LOLER)', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'PLAT-01'

UNION ALL
SELECT id, 'Monthly Safety Device Test', 'monthly', 2, 1
FROM industry_standard_asset_library WHERE standard_code = 'TRAV-01'
UNION ALL
SELECT id, 'Quarterly Belt and Drive Inspection', 'quarterly', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'TRAV-01'
UNION ALL
SELECT id, 'Semiannual Emergency Stop and Safety Test', 'semiannual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'TRAV-01'
UNION ALL
SELECT id, 'Annual Full Service and Brake Test', 'annual', 4, 4
FROM industry_standard_asset_library WHERE standard_code = 'TRAV-01';

-- Plumbing Assets (remaining ones)
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Semiannual Cleaning and Disinfection', 'semiannual', 4, 1
FROM industry_standard_asset_library WHERE standard_code = 'TANK-01'
UNION ALL
SELECT id, 'Semiannual Water Quality Test', 'semiannual', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'TANK-01'
UNION ALL
SELECT id, 'Annual Structural Inspection', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'TANK-01'
UNION ALL
SELECT id, 'Annual Valve and Pipework Inspection', 'annual', 1.5, 4
FROM industry_standard_asset_library WHERE standard_code = 'TANK-01'

UNION ALL
SELECT id, 'Quarterly Temperature Check and Adjustment', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'WHT-01'
UNION ALL
SELECT id, 'Semiannual Safety Valve Test', 'semiannual', 0.75, 2
FROM industry_standard_asset_library WHERE standard_code = 'WHT-01'
UNION ALL
SELECT id, 'Annual Element and Thermostat Inspection', 'annual', 1.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'WHT-01'
UNION ALL
SELECT id, 'Annual Tank Descaling', 'annual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'WHT-01'

UNION ALL
SELECT id, 'Semiannual Flow Test', 'semiannual', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'DRAIN-01'
UNION ALL
SELECT id, 'Annual CCTV Inspection', 'annual', 3, 2
FROM industry_standard_asset_library WHERE standard_code = 'DRAIN-01'
UNION ALL
SELECT id, 'Annual High Pressure Jetting', 'annual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'DRAIN-01'

UNION ALL
SELECT id, 'Monthly Cleaning and Inspection', 'monthly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'GREASE-01'
UNION ALL
SELECT id, 'Quarterly Pumping and Disposal', 'quarterly', 2, 2
FROM industry_standard_asset_library WHERE standard_code = 'GREASE-01'
UNION ALL
SELECT id, 'Annual Structural Inspection', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'GREASE-01'

UNION ALL
SELECT id, 'Monthly Function and Float Test', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'SUMP-01'
UNION ALL
SELECT id, 'Quarterly Motor and Seal Inspection', 'quarterly', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'SUMP-01'
UNION ALL
SELECT id, 'Semiannual Impeller Cleaning', 'semiannual', 1.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'SUMP-01'
UNION ALL
SELECT id, 'Annual Overhaul', 'annual', 3, 4
FROM industry_standard_asset_library WHERE standard_code = 'SUMP-01'

UNION ALL
SELECT id, 'Semiannual Pressure Setting Check', 'semiannual', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'PRV-01'
UNION ALL
SELECT id, 'Annual Valve Inspection and Testing', 'annual', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'PRV-01'
UNION ALL
SELECT id, 'Annual Diaphragm/Seal Replacement', 'annual', 1.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'PRV-01'

UNION ALL
SELECT id, 'Quarterly Temperature Calibration', 'quarterly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'TMV-01'
UNION ALL
SELECT id, 'Annual Full Service and Commissioning', 'annual', 1, 2
FROM industry_standard_asset_library WHERE standard_code = 'TMV-01'
UNION ALL
SELECT id, 'Annual Valve Replacement', 'annual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'TMV-01'

UNION ALL
SELECT id, 'Semiannual Leak Check', 'semiannual', 0.15, 1
FROM industry_standard_asset_library WHERE standard_code = 'WC-01'
UNION ALL
SELECT id, 'Annual Flush Mechanism Service', 'annual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'WC-01'
UNION ALL
SELECT id, 'Annual Pan and Seat Inspection', 'annual', 0.25, 3
FROM industry_standard_asset_library WHERE standard_code = 'WC-01'

UNION ALL
SELECT id, 'Semiannual Tap and Waste Check', 'semiannual', 0.15, 1
FROM industry_standard_asset_library WHERE standard_code = 'WHB-01'
UNION ALL
SELECT id, 'Annual Tap Service and Seal Replacement', 'annual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'WHB-01'
UNION ALL
SELECT id, 'Annual Trap Cleaning', 'annual', 0.25, 3
FROM industry_standard_asset_library WHERE standard_code = 'WHB-01';

-- Security Assets
INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Monthly Lens Cleaning', 'monthly', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'CCTV-01'
UNION ALL
SELECT id, 'Quarterly Focus and Alignment Check', 'quarterly', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'CCTV-01'
UNION ALL
SELECT id, 'Semiannual Housing and Cable Inspection', 'semiannual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'CCTV-01'
UNION ALL
SELECT id, 'Annual Full Functional Test', 'annual', 0.75, 4
FROM industry_standard_asset_library WHERE standard_code = 'CCTV-01'

UNION ALL
SELECT id, 'Monthly Recording and Storage Check', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'DVR-01'
UNION ALL
SELECT id, 'Quarterly Hard Drive Health Check', 'quarterly', 0.75, 2
FROM industry_standard_asset_library WHERE standard_code = 'DVR-01'
UNION ALL
SELECT id, 'Semiannual Backup and Archiving Test', 'semiannual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'DVR-01'
UNION ALL
SELECT id, 'Annual Hard Drive Replacement', 'annual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'DVR-01'

UNION ALL
SELECT id, 'Monthly Panel Status and Alarm Test', 'monthly', 0.5, 1
FROM industry_standard_asset_library WHERE standard_code = 'ACS-01'
UNION ALL
SELECT id, 'Quarterly Database Backup Verification', 'quarterly', 0.75, 2
FROM industry_standard_asset_library WHERE standard_code = 'ACS-01'
UNION ALL
SELECT id, 'Semiannual Full System Test', 'semiannual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'ACS-01'
UNION ALL
SELECT id, 'Annual Battery and Power Supply Test', 'annual', 1, 4
FROM industry_standard_asset_library WHERE standard_code = 'ACS-01'

UNION ALL
SELECT id, 'Monthly Card Read Test', 'monthly', 0.15, 1
FROM industry_standard_asset_library WHERE standard_code = 'READER-01'
UNION ALL
SELECT id, 'Quarterly Cleaning and Inspection', 'quarterly', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'READER-01'
UNION ALL
SELECT id, 'Annual Firmware Update', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'READER-01'

UNION ALL
SELECT id, 'Monthly Panel and Sensor Test', 'monthly', 0.75, 1
FROM industry_standard_asset_library WHERE standard_code = 'INT-01'
UNION ALL
SELECT id, 'Quarterly Battery Test', 'quarterly', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'INT-01'
UNION ALL
SELECT id, 'Semiannual Communication Test', 'semiannual', 1, 3
FROM industry_standard_asset_library WHERE standard_code = 'INT-01'
UNION ALL
SELECT id, 'Annual Full System Test', 'annual', 2, 4
FROM industry_standard_asset_library WHERE standard_code = 'INT-01'

UNION ALL
SELECT id, 'Quarterly Detection Test', 'quarterly', 0.25, 1
FROM industry_standard_asset_library WHERE standard_code = 'PIR-01'
UNION ALL
SELECT id, 'Semiannual Sensitivity and Coverage Test', 'semiannual', 0.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'PIR-01'
UNION ALL
SELECT id, 'Annual Lens Cleaning and Calibration', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'PIR-01'

UNION ALL
SELECT id, 'Quarterly Operation Test', 'quarterly', 0.15, 1
FROM industry_standard_asset_library WHERE standard_code = 'DOOR-01'
UNION ALL
SELECT id, 'Semiannual Gap and Alignment Check', 'semiannual', 0.25, 2
FROM industry_standard_asset_library WHERE standard_code = 'DOOR-01'
UNION ALL
SELECT id, 'Annual Wiring and Connection Inspection', 'annual', 0.5, 3
FROM industry_standard_asset_library WHERE standard_code = 'DOOR-01'

UNION ALL
SELECT id, 'Monthly Operation and Safety Test', 'monthly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'TURNSTILE-01'
UNION ALL
SELECT id, 'Quarterly Mechanism Lubrication', 'quarterly', 1.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'TURNSTILE-01'
UNION ALL
SELECT id, 'Semiannual Motor and Control System Check', 'semiannual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'TURNSTILE-01'
UNION ALL
SELECT id, 'Annual Full Service', 'annual', 3, 4
FROM industry_standard_asset_library WHERE standard_code = 'TURNSTILE-01'

UNION ALL
SELECT id, 'Monthly Operation and Safety Test', 'monthly', 1, 1
FROM industry_standard_asset_library WHERE standard_code = 'BARRIER-01'
UNION ALL
SELECT id, 'Quarterly Hydraulic System Check', 'quarterly', 1.5, 2
FROM industry_standard_asset_library WHERE standard_code = 'BARRIER-01'
UNION ALL
SELECT id, 'Semiannual Safety Device Test', 'semiannual', 2, 3
FROM industry_standard_asset_library WHERE standard_code = 'BARRIER-01'
UNION ALL
SELECT id, 'Annual Full Service and Arm Alignment', 'annual', 3, 4
FROM industry_standard_asset_library WHERE standard_code = 'BARRIER-01';
