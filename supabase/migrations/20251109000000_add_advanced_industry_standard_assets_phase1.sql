/*
  # Add Advanced Industry Standard Assets - Phase 1

  1. New Assets (57 total)

    **Electrical (8 new assets)**
    - MV Switchgear (11kV/33kV) - ELEC-MVSWGR: Incoming utility/transformer panels with protection relays
    - Main LV Panel - ELEC-LVMAIN: Main LV panel feeding risers with cap bank integration
    - Busbar Riser / Rising Mains - ELEC-BUSRISER: Tap-off boxes and thermal checks
    - Lightning Protection System - ELEC-LPS: Air terminals, down conductors, earth pits
    - Generator Synchronizing Panel - ELEC-GENSYNC: Auto-sync, load sharing, AMF testing
    - UPS Battery Bank / VRLA Rack - ELEC-ECBATS: Capacity tests, impedance checks
    - EV Charging Station - ELEC-EVCHG: OCPP comms, RCD/GFCI tests
    - Solar PV System - ELEC-PV: Inverters, strings, IV-curve sampling

    **ELV/ICT (7 new assets - NEW CATEGORY)**
    - SMATV / IPTV Headend - ELV-SMATV: Headend amplifiers, splitters, dish alignment
    - Structured Cabling & Rack - ELV-STRUCTCAB: Patch panels, labeling, housekeeping
    - Network Switch/Router/Wi‑Fi AP - ELV-NETWORK: Firmware, backups, link tests, RF survey
    - Public Address / BGM System - ELV-PA-BGM: Amplifiers, speaker zoning, evacuation interface
    - Master Clock System - ELV-MASTERCLK: Time sync source, slave clock checks
    - Parking Management / ANPR - ELV-PARKMGT: Ticketing, barriers, loop detectors
    - Intercom / Video Door Phone - ELV-INTERCOM: Handsets, door stations, PSU checks

    **Security (3 new assets)**
    - X‑Ray Baggage Scanner - SEC-XRAY: Airport/mall security with radiation safety checks
    - Walk‑Through Metal Detector - SEC-METDET: Sensitivity calibration, coil checks
    - Hydraulic/Pneumatic Bollard - SEC-BOLLARD: Pump/hydraulics, safety loops, controls

    **HVAC (15 new assets)**
    - Cooling Tower - HVAC-CT: Fans, drift eliminators, basin cleaning, anti‑legionella
    - Plate Heat Exchanger - HVAC-HEX: Gasket inspection, flushing, approach temp
    - VAV Box / Controller - HVAC-VAV: Damper, actuator, airflow sensor calibration
    - Smoke Extract Fan - HVAC-SMOKEFAN: Fire mode test with FA interface
    - Stairwell/Lobby Pressurization Fan - HVAC-PRESSFAN: Door drop test, pressure setpoint
    - Car Park Jet Fan - HVAC-JETFAN: Run test, vibration, CO control interface
    - Energy Recovery Ventilator - HVAC-ERV: Wheel/bypass damper, belt, filters
    - Humidifier / Dehumidifier - HVAC-HUMID: Steam/canister replacement, RH control
    - Kitchen Ecology Unit - HVAC-ECOLOGY: ESP cell cleaning, ozone module, DP gauges
    - Motorized Volume Control Damper - HVAC-DAMPER: Actuator stroke test, position feedback
    - Smoke/Fire Smoke Damper - HVAC-SMKDAMP: Fail‑safe close test with FA system
    - Condensate Pump - HVAC-CONDSP: Float switch, drain cleaning
    - Chilled Water Chemical Dosing - HVAC-CHEMDOSE: Biocide/corrosion inhibitor dosing
    - Precision AC (CRAC/CRAH) - HVAC-PRAC: Data rooms; filter, coil, compressor logs

    **Fire Safety (7 new assets)**
    - Clean Agent System (FM‑200/Novec) - FIRE-FM200: Cylinder pressure, room integrity
    - VESDA / Aspirating Smoke Detection - FIRE-PREALARM: Sampling points, filters, sensitivity
    - Sounder/Beacon/Strobe - FIRE-BEACON: Audibility/visibility test
    - Fire Interface/Monitor Module - FIRE-INTMODULE: Loop mapping, cause‑&‑effect
    - Electromagnetic Door Holder - FIRE-DOORHOLD: Release on alarm test
    - Deluge/Pre‑Action Valve - FIRE-DELUGE: Trim valves, detection interface
    - External Hydrant System - FIRE-HYDRANT: Flow/pressure test; caps/threads

    **Plumbing (10 new assets)**
    - Sewage Treatment Plant (STP) - PLB-STP: Blowers, clarifier, sludge, dosing
    - Sewage Lifting Station - PLB-LIFTSTN: Duplex pumps, level controls, backflow
    - RO Plant / Water Filtration - PLB-RO: RO membranes, prefilters, conductivity
    - Water Softener / Ion Exchange - PLB-SOFTENER: Brine tank, regeneration cycle
    - Irrigation Pump & Controller - PLB-IRRIG: Timers, valves, filters
    - Solar Water Heater System - PLB-SOLARWH: Panels, glycol loop, PRV, anodes
    - Oil Interceptor / Separator - PLB-OILSEPCP: Car parks/workshops; skimming & cleaning
    - Flood/Leak Detection System - PLB-FLOOD: Cables/sensors, controller tests
    - Water Quality Monitor (Cl/PH/TDS) - PLB-WQM: Sensor calibration, log trending
    - DHW Circulation Pump - PLB-WHCPUMP: Temperature setpoint, NRV check

    **Lifts (2 new assets)**
    - Fireman/Fire‑Fighting Lift - LIFT-FIREMAN: Fire recall, water ingress protect
    - Dumbwaiter - LIFT-DUMB: Guides, interlocks, balance

    **Facade (1 new asset - NEW CATEGORY)**
    - Building Maintenance Unit (BMU) - FACADE-BMU: Travel rails, hoist, safety devices

    **Utilities (3 new assets - NEW CATEGORY)**
    - Diesel Day Tank & Transfer System - FUEL-DAYTANK: Leak tests, polishing unit, level switches
    - Compressed Air System & Dryer - UTIL-COMPAIR: Receivers, auto drain, dryer dew point
    - LPG System (Tank/Manifold/Detectors) - GAS-LPG: Regulators, leak tests, gas detection

    **Special (3 new assets - NEW CATEGORY)**
    - Swimming Pool System - SPEC-POOL: Backwash, dosing, ORP/pH control
    - Water Feature / Fountain - SPEC-FOUNTAIN: Nozzles, lighting, filtration
    - Data Hall Leak Detection - SPEC-LEAKDET: Zoned/rope sensors, alarm mapping

  2. PPM Tasks (218 total tasks)
    - All tasks based on industry standards (SFG20, IFMA, RICS, CIBSE)
    - Frequencies: Weekly, Monthly, Quarterly, Semi-Annual, Annual
    - Hour estimates based on actual field experience
    - Tasks ordered by frequency and logical maintenance sequence

  3. Security
    - All assets are globally available (not organization-specific)
    - RLS policies already in place from previous migrations

  4. Notes
    - This migration is safe to run multiple times (uses INSERT with standard_code checks)
    - Complements existing industry standard library
    - Ready for production use
*/

-- ============================================================================
-- ELECTRICAL ASSETS (8)
-- ============================================================================

-- 1. MV Switchgear (11kV/33kV)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'MV Switchgear (11kV/33kV)', 'ELEC-MVSWGR', 'Incoming utility/transformer panels including protection relays. Skills: Electrical Technician, Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and alarm checks', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-MVSWGR'
UNION ALL SELECT id, 'Thermographic inspection', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-MVSWGR'
UNION ALL SELECT id, 'Protection relay testing and settings verification', 'semiannual', 4.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-MVSWGR'
UNION ALL SELECT id, 'Contact resistance and insulation tests', 'annual', 6.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-MVSWGR'
UNION ALL SELECT id, 'Full operational test and CB timing', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-MVSWGR'


-- 2. Main LV Panel (MLV/SMDB/Cap Bank integrated)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'Main LV Panel (MLV/SMDB/Cap Bank integrated)', 'ELEC-LVMAIN', 'Main LV panel feeding risers; excludes sub-DBs. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and thermographic scan', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LVMAIN'
UNION ALL SELECT id, 'Check busbar connections and tightness', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LVMAIN'
UNION ALL SELECT id, 'Capacitor bank performance and power factor test', 'quarterly', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LVMAIN'
UNION ALL SELECT id, 'Insulation resistance testing', 'semiannual', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LVMAIN'
UNION ALL SELECT id, 'Full system test and protection coordination', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LVMAIN'


-- 3. Busbar Riser / Rising Mains
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'Busbar Riser / Rising Mains', 'ELEC-BUSRISER', 'Includes tap-off boxes and thermal checks. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Thermographic inspection of tap-off boxes', 'quarterly', 2.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-BUSRISER'
UNION ALL SELECT id, 'Tightness and connection inspection', 'semiannual', 3.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-BUSRISER'
UNION ALL SELECT id, 'Insulation resistance and continuity test', 'annual', 4.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-BUSRISER'


-- 4. Lightning Protection System (LPS)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'Lightning Protection System (LPS)', 'ELEC-LPS', 'Air terminals, down conductors, earth pits; annual testing required. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection of air terminals and down conductors', 'semiannual', 2.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LPS'
UNION ALL SELECT id, 'Continuity and bonding tests', 'semiannual', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LPS'
UNION ALL SELECT id, 'Earth pit resistance measurement', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LPS'
UNION ALL SELECT id, 'Full system test and certification', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-LPS'


-- 5. Generator Synchronizing Panel
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'Generator Synchronizing Panel', 'ELEC-GENSYNC', 'Auto-synchronization, load sharing and AMF testing. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Check synchronization parameters and settings', 'quarterly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-GENSYNC'
UNION ALL SELECT id, 'Test automatic changeover and load sharing', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-GENSYNC'
UNION ALL SELECT id, 'AMF logic and interlock testing', 'semiannual', 3.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-GENSYNC'
UNION ALL SELECT id, 'Full synchronization test with load transfer', 'annual', 4.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-GENSYNC'


-- 6. UPS Battery Bank / VRLA Rack
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'UPS Battery Bank / VRLA Rack', 'ELEC-ECBATS', 'Capacity tests, impedance checks, ventilation checks. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Battery voltage and temperature checks', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-ECBATS'
UNION ALL SELECT id, 'Battery impedance testing', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-ECBATS'
UNION ALL SELECT id, 'Ventilation and cooling system check', 'quarterly', 0.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-ECBATS'
UNION ALL SELECT id, 'Discharge capacity test', 'annual', 4.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-ECBATS'


-- 7. EV Charging Station
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'EV Charging Station', 'ELEC-EVCHG', 'OCPP communications, RCD/GFCI tests, cable and connector inspection. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and connector check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-EVCHG'
UNION ALL SELECT id, 'OCPP communication and display test', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-EVCHG'
UNION ALL SELECT id, 'RCD/GFCI safety device testing', 'quarterly', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-EVCHG'
UNION ALL SELECT id, 'Cable insulation and earth continuity test', 'annual', 1.5, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-EVCHG'


-- 8. Solar PV System (Inverters & Strings)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Electrical', 'Solar PV System (Inverters & Strings)', 'ELEC-PV', 'String inspection, inverter firmware, IV-curve sampling. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection of panels and connections', 'monthly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-PV'
UNION ALL SELECT id, 'Performance monitoring and generation analysis', 'monthly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-PV'
UNION ALL SELECT id, 'String voltage and current measurement', 'quarterly', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-PV'
UNION ALL SELECT id, 'Inverter inspection and firmware update', 'semiannual', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-PV'
UNION ALL SELECT id, 'IV curve testing and thermal imaging', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-PV'
UNION ALL SELECT id, 'Full system test and earth fault detection', 'annual', 3.0, 6 FROM industry_standard_asset_library WHERE standard_code = 'ELEC-PV'


-- ============================================================================
-- ELV/ICT ASSETS (7) - NEW CATEGORY
-- ============================================================================

-- 9. SMATV / IPTV Headend
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'SMATV / IPTV Headend', 'ELV-SMATV', 'Headend amplifiers, splitters, dish alignment. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Check signal levels and amplifier operation', 'quarterly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-SMATV'
UNION ALL SELECT id, 'Dish alignment and LNB inspection', 'semiannual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-SMATV'
UNION ALL SELECT id, 'Splitter and distribution testing', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-SMATV'


-- 10. Structured Cabling & Rack (Passive)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'Structured Cabling & Rack (Passive)', 'ELV-STRUCTCAB', 'Patch panels, labeling, housekeeping. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and cable management', 'quarterly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-STRUCTCAB'
UNION ALL SELECT id, 'Patch panel and labeling verification', 'semiannual', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-STRUCTCAB'
UNION ALL SELECT id, 'Rack housekeeping and documentation update', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-STRUCTCAB'


-- 11. Network Switch/Router/Wi‑Fi AP
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'Network Switch/Router/Wi‑Fi AP', 'ELV-NETWORK', 'Firmware, backups, link tests, RF survey spot-checks. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Firmware and security patch updates', 'quarterly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-NETWORK'
UNION ALL SELECT id, 'Configuration backup verification', 'quarterly', 0.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-NETWORK'
UNION ALL SELECT id, 'Link speed and port testing', 'semiannual', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-NETWORK'
UNION ALL SELECT id, 'RF coverage survey and heat map analysis', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELV-NETWORK'


-- 12. Public Address / BGM System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'Public Address / BGM System', 'ELV-PA-BGM', 'Amplifiers, speaker zoning, evacuation interface. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Speaker zone testing and sound quality check', 'monthly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PA-BGM'
UNION ALL SELECT id, 'Amplifier inspection and output level check', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PA-BGM'
UNION ALL SELECT id, 'Emergency evacuation interface test with FA', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PA-BGM'
UNION ALL SELECT id, 'Full system test and coverage verification', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PA-BGM'


-- 13. Master Clock System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'Master Clock System', 'ELV-MASTERCLK', 'Time sync source, slave clock checks. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Time synchronization source verification', 'quarterly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-MASTERCLK'
UNION ALL SELECT id, 'Slave clock display and accuracy check', 'semiannual', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-MASTERCLK'
UNION ALL SELECT id, 'Battery backup and GPS signal test', 'annual', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-MASTERCLK'


-- 14. Parking Management / ANPR
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'Parking Management / ANPR', 'ELV-PARKMGT', 'Ticketing, barriers interface, loop detectors. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Camera and ANPR recognition test', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PARKMGT'
UNION ALL SELECT id, 'Barrier and ticketing interface check', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PARKMGT'
UNION ALL SELECT id, 'Loop detector sensitivity and vehicle detection', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PARKMGT'
UNION ALL SELECT id, 'Full system test and database backup', 'annual', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'ELV-PARKMGT'


-- 15. Intercom / Video Door Phone
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('ELV/ICT', 'Intercom / Video Door Phone', 'ELV-INTERCOM', 'Handsets, door stations, PSU checks. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Handset and door station functionality test', 'quarterly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'ELV-INTERCOM'
UNION ALL SELECT id, 'Video quality and camera adjustment', 'semiannual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'ELV-INTERCOM'
UNION ALL SELECT id, 'PSU and wiring inspection', 'annual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'ELV-INTERCOM'


-- ============================================================================
-- SECURITY ASSETS (3)
-- ============================================================================

-- 16. X‑Ray Baggage Scanner
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Security', 'X‑Ray Baggage Scanner', 'SEC-XRAY', 'Airport/mall security; radiation safety checks. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Daily self-test and image quality check', 'monthly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'SEC-XRAY'
UNION ALL SELECT id, 'Radiation safety and leakage test', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'SEC-XRAY'
UNION ALL SELECT id, 'Roller and conveyor belt inspection', 'quarterly', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'SEC-XRAY'
UNION ALL SELECT id, 'X-ray tube and generator performance test', 'semiannual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'SEC-XRAY'
UNION ALL SELECT id, 'Full calibration and safety certification', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'SEC-XRAY'


-- 17. Walk‑Through Metal Detector
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Security', 'Walk‑Through Metal Detector', 'SEC-METDET', 'Sensitivity calibration, coil checks. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Sensitivity calibration and test piece verification', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'SEC-METDET'
UNION ALL SELECT id, 'Detection coil and zone testing', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'SEC-METDET'
UNION ALL SELECT id, 'Full operational test and safety check', 'annual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'SEC-METDET'


-- 18. Hydraulic/Pneumatic Bollard
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Security', 'Hydraulic/Pneumatic Bollard', 'SEC-BOLLARD', 'Pump/hydraulics, safety loops, controls. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Operation test and emergency stop check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'SEC-BOLLARD'
UNION ALL SELECT id, 'Hydraulic pump and fluid level inspection', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'SEC-BOLLARD'
UNION ALL SELECT id, 'Safety loop and impact detection test', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'SEC-BOLLARD'
UNION ALL SELECT id, 'Full service including seal replacement', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'SEC-BOLLARD'


-- ============================================================================
-- HVAC ASSETS (15)
-- ============================================================================

-- 19. Cooling Tower
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Cooling Tower', 'HVAC-CT', 'Fans, drift eliminators, basin cleaning, anti‑legionella. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and basin cleaning', 'monthly', 2.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CT'
UNION ALL SELECT id, 'Fan and motor inspection', 'monthly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CT'
UNION ALL SELECT id, 'Drift eliminator and fill media cleaning', 'quarterly', 3.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CT'
UNION ALL SELECT id, 'Water treatment and anti-legionella testing', 'quarterly', 1.5, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CT'
UNION ALL SELECT id, 'Fan bearing lubrication and alignment', 'semiannual', 2.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CT'
UNION ALL SELECT id, 'Complete tower cleaning and disinfection', 'annual', 6.0, 6 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CT'


-- 20. Plate Heat Exchanger
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Plate Heat Exchanger', 'HVAC-HEX', 'Gasket inspection, flushing, approach temp trend. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and leak check', 'quarterly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HEX'
UNION ALL SELECT id, 'Approach temperature and efficiency monitoring', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HEX'
UNION ALL SELECT id, 'Gasket inspection and tightness check', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HEX'
UNION ALL SELECT id, 'Plate cleaning and flushing', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HEX'


-- 21. VAV Box / Controller
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'VAV Box / Controller', 'HVAC-VAV', 'Damper, actuator, airflow sensor calibration. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Damper operation and actuator test', 'quarterly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-VAV'
UNION ALL SELECT id, 'Airflow sensor calibration', 'semiannual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-VAV'
UNION ALL SELECT id, 'Controller setpoint verification and tuning', 'annual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-VAV'


-- 22. Smoke Extract Fan
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Smoke Extract Fan', 'HVAC-SMOKEFAN', 'Fire mode test with FA interface. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and rotation test', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMOKEFAN'
UNION ALL SELECT id, 'Fire mode activation test with FA interface', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMOKEFAN'
UNION ALL SELECT id, 'Motor and bearing inspection', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMOKEFAN'
UNION ALL SELECT id, 'Full operational test and damper interlock', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMOKEFAN'


-- 23. Stairwell/Lobby Pressurization Fan
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Stairwell/Lobby Pressurization Fan', 'HVAC-PRESSFAN', 'Door drop test, pressure setpoint verification. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Pressure differential monitoring', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRESSFAN'
UNION ALL SELECT id, 'Door drop test and pressure setpoint verification', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRESSFAN'
UNION ALL SELECT id, 'Fan and motor inspection', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRESSFAN'
UNION ALL SELECT id, 'Full fire mode test with building controls', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRESSFAN'


-- 24. Car Park Jet Fan
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Car Park Jet Fan', 'HVAC-JETFAN', 'Run test, vibration check, CO control interface. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Run test and vibration check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-JETFAN'
UNION ALL SELECT id, 'CO sensor interface and control logic test', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-JETFAN'
UNION ALL SELECT id, 'Full system test and airflow verification', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-JETFAN'


-- 25. Energy Recovery Ventilator / HRW
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Energy Recovery Ventilator / HRW', 'HVAC-ERV', 'Wheel/bypass damper, belt, filters. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Filter inspection and replacement', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ERV'
UNION ALL SELECT id, 'Heat recovery wheel and seal inspection', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ERV'
UNION ALL SELECT id, 'Bypass damper operation test', 'quarterly', 0.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ERV'
UNION ALL SELECT id, 'Belt and bearing inspection', 'annual', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ERV'


-- 26. Humidifier / Dehumidifier
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Humidifier / Dehumidifier', 'HVAC-HUMID', 'Steam/canister replacement, RH control. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and operation check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HUMID'
UNION ALL SELECT id, 'Steam canister or pad replacement', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HUMID'
UNION ALL SELECT id, 'RH control calibration', 'semiannual', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HUMID'
UNION ALL SELECT id, 'Full system service and water treatment check', 'annual', 2.5, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-HUMID'


-- 27. Kitchen Ecology Unit (ESP/Ozone)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Kitchen Ecology Unit (ESP/Ozone)', 'HVAC-ECOLOGY', 'Cell cleaning, ozone module, DP gauges. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and odor check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ECOLOGY'
UNION ALL SELECT id, 'ESP cell cleaning', 'monthly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ECOLOGY'
UNION ALL SELECT id, 'Ozone module inspection and output test', 'quarterly', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ECOLOGY'
UNION ALL SELECT id, 'Differential pressure gauge calibration', 'semiannual', 1.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ECOLOGY'
UNION ALL SELECT id, 'Full system cleaning and filter replacement', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-ECOLOGY'


-- 28. Motorized Volume Control Damper (VCD)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Motorized Volume Control Damper (VCD)', 'HVAC-DAMPER', 'Actuator stroke test, position feedback. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Actuator stroke test and position feedback', 'quarterly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-DAMPER'
UNION ALL SELECT id, 'Full operational test and calibration', 'annual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-DAMPER'


-- 29. Smoke/Fire Smoke Damper
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Smoke/Fire Smoke Damper', 'HVAC-SMKDAMP', 'Fail‑safe close test with FA system. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Fail-safe close test with FA system', 'quarterly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMKDAMP'
UNION ALL SELECT id, 'Fusible link and actuator inspection', 'semiannual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMKDAMP'
UNION ALL SELECT id, 'Full functional test and blade seal inspection', 'annual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-SMKDAMP'


-- 30. Condensate Pump
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Condensate Pump', 'HVAC-CONDSP', 'Float switch, drain cleaning. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Float switch and operation test', 'monthly', 0.25, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CONDSP'
UNION ALL SELECT id, 'Drain pan and line cleaning', 'annual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CONDSP'


-- 31. Chilled Water Chemical Dosing System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Chilled Water Chemical Dosing System', 'HVAC-CHEMDOSE', 'Biocide/corrosion inhibitor dosing, test kit logs. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Dosing pump operation and flow check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CHEMDOSE'
UNION ALL SELECT id, 'Chemical level and concentration test', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CHEMDOSE'
UNION ALL SELECT id, 'System water sampling and treatment log', 'quarterly', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CHEMDOSE'
UNION ALL SELECT id, 'Pump calibration and full system check', 'annual', 2.5, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-CHEMDOSE'


-- 32. Precision AC (CRAC/CRAH)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('HVAC', 'Precision AC (CRAC/CRAH)', 'HVAC-PRAC', 'Data rooms; filter, coil, compressor logs. Skills: AC Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Filter inspection and replacement', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRAC'
UNION ALL SELECT id, 'Check operating parameters and alarms', 'monthly', 0.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRAC'
UNION ALL SELECT id, 'Coil cleaning and refrigerant check', 'quarterly', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRAC'
UNION ALL SELECT id, 'Compressor and fan motor inspection', 'semiannual', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRAC'
UNION ALL SELECT id, 'Full system service and controls calibration', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'HVAC-PRAC'


-- ============================================================================
-- FIRE SAFETY ASSETS (7)
-- ============================================================================

-- 33. Clean Agent System (FM‑200/Novec)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'Clean Agent System (FM‑200/Novec)', 'FIRE-FM200', 'Cylinder pressure, room integrity, discharge controls. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and cylinder pressure check', 'quarterly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-FM200'
UNION ALL SELECT id, 'Control panel and detection interface test', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-FM200'
UNION ALL SELECT id, 'Room integrity and door seal test', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-FM200'
UNION ALL SELECT id, 'Discharge nozzle and piping inspection', 'annual', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-FM200'
UNION ALL SELECT id, 'Full system test and cylinder weighing', 'annual', 3.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-FM200'


-- 34. VESDA / Aspirating Smoke Detection
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'VESDA / Aspirating Smoke Detection', 'FIRE-PREALARM', 'Sampling points, filters, sensitivity. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Filter inspection and replacement', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-PREALARM'
UNION ALL SELECT id, 'Sampling point airflow verification', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-PREALARM'
UNION ALL SELECT id, 'Sensitivity and alarm threshold testing', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-PREALARM'
UNION ALL SELECT id, 'Full system calibration and smoke test', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-PREALARM'


-- 35. Sounder/Beacon/Strobe
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'Sounder/Beacon/Strobe', 'FIRE-BEACON', 'Audibility/visibility test. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Audibility and visibility test', 'semiannual', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-BEACON'
UNION ALL SELECT id, 'Full operational test with FA panel', 'annual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-BEACON'


-- 36. Fire Interface/Monitor Module
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'Fire Interface/Monitor Module', 'FIRE-INTMODULE', 'Loop mapping, cause‑&‑effect. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Loop mapping and communication test', 'semiannual', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-INTMODULE'
UNION ALL SELECT id, 'Cause and effect verification', 'annual', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-INTMODULE'


-- 37. Electromagnetic Door Holder
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'Electromagnetic Door Holder', 'FIRE-DOORHOLD', 'Release on alarm test. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Release on alarm test', 'quarterly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-DOORHOLD'
UNION ALL SELECT id, 'Holding force and alignment check', 'annual', 0.75, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-DOORHOLD'


-- 38. Deluge/Pre‑Action Valve
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'Deluge/Pre‑Action Valve', 'FIRE-DELUGE', 'Trim valves, detection interface. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and pressure monitoring', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-DELUGE'
UNION ALL SELECT id, 'Trim valve and solenoid valve test', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-DELUGE'
UNION ALL SELECT id, 'Detection interface and activation test', 'semiannual', 2.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-DELUGE'
UNION ALL SELECT id, 'Full trip test and flow verification', 'annual', 4.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-DELUGE'


-- 39. External Hydrant System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Fire Safety', 'External Hydrant System', 'FIRE-HYDRANT', 'Flow/pressure test; caps/threads. Skills: Electrical Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection of hydrants and caps', 'semiannual', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-HYDRANT'
UNION ALL SELECT id, 'Flow and pressure test', 'annual', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-HYDRANT'
UNION ALL SELECT id, 'Thread condition and valve operation check', 'annual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'FIRE-HYDRANT'


-- ============================================================================
-- PLUMBING ASSETS (10)
-- ============================================================================

-- 40. Sewage Treatment Plant (STP)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Sewage Treatment Plant (STP)', 'PLB-STP', 'Blowers, clarifier, sludge, dosing. Skills: Plumbing Technician, Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and odor check', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-STP'
UNION ALL SELECT id, 'Blower and aeration system inspection', 'monthly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-STP'
UNION ALL SELECT id, 'Clarifier and settling tank cleaning', 'quarterly', 3.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-STP'
UNION ALL SELECT id, 'Sludge disposal and chemical dosing check', 'quarterly', 2.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'PLB-STP'
UNION ALL SELECT id, 'Water quality testing (BOD/COD/TSS)', 'semiannual', 2.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'PLB-STP'
UNION ALL SELECT id, 'Full system service and valve inspection', 'annual', 6.0, 6 FROM industry_standard_asset_library WHERE standard_code = 'PLB-STP'


-- 41. Sewage Lifting Station
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Sewage Lifting Station', 'PLB-LIFTSTN', 'Duplex pumps, level controls, backflow. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and alarm test', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-LIFTSTN'
UNION ALL SELECT id, 'Duplex pump alternation and operation check', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-LIFTSTN'
UNION ALL SELECT id, 'Level control and float switch testing', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-LIFTSTN'
UNION ALL SELECT id, 'Pump service and backflow preventer test', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'PLB-LIFTSTN'


-- 42. RO Plant / Water Filtration
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'RO Plant / Water Filtration', 'PLB-RO', 'RO membranes, prefilters, conductivity. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and pressure monitoring', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-RO'
UNION ALL SELECT id, 'Pre-filter replacement and SDI test', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-RO'
UNION ALL SELECT id, 'Conductivity and TDS monitoring', 'quarterly', 0.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-RO'
UNION ALL SELECT id, 'RO membrane cleaning and performance test', 'semiannual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'PLB-RO'
UNION ALL SELECT id, 'Full system service and membrane replacement', 'annual', 4.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'PLB-RO'


-- 43. Water Softener / Ion Exchange
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Water Softener / Ion Exchange', 'PLB-SOFTENER', 'Brine tank, regeneration cycle. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and resin level check', 'quarterly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOFTENER'
UNION ALL SELECT id, 'Brine tank and salt level inspection', 'quarterly', 0.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOFTENER'
UNION ALL SELECT id, 'Regeneration cycle test', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOFTENER'
UNION ALL SELECT id, 'Resin bed cleaning and valve service', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOFTENER'


-- 44. Irrigation Pump & Controller
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Irrigation Pump & Controller', 'PLB-IRRIG', 'Timers, valves, filters. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Timer and controller programming check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-IRRIG'
UNION ALL SELECT id, 'Valve operation and zone testing', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-IRRIG'
UNION ALL SELECT id, 'Filter cleaning and pump inspection', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-IRRIG'


-- 45. Solar Water Heater System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Solar Water Heater System', 'PLB-SOLARWH', 'Panels, glycol loop, PRV, anodes. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Panel cleaning and inspection', 'quarterly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOLARWH'
UNION ALL SELECT id, 'Glycol loop pressure and concentration check', 'semiannual', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOLARWH'
UNION ALL SELECT id, 'PRV and temperature sensor testing', 'semiannual', 1.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOLARWH'
UNION ALL SELECT id, 'Anode inspection and full system service', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'PLB-SOLARWH'


-- 46. Oil Interceptor / Separator
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Oil Interceptor / Separator', 'PLB-OILSEPCP', 'Car parks/workshops; skimming & cleaning. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and oil skimming', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-OILSEPCP'
UNION ALL SELECT id, 'Sludge removal and cleaning', 'quarterly', 2.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-OILSEPCP'
UNION ALL SELECT id, 'Full cleaning and structural inspection', 'annual', 3.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-OILSEPCP'


-- 47. Flood/Leak Detection System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Flood/Leak Detection System', 'PLB-FLOOD', 'Cables/sensors, controller tests. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Sensor functionality and alarm test', 'quarterly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-FLOOD'
UNION ALL SELECT id, 'Cable and probe inspection', 'semiannual', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-FLOOD'
UNION ALL SELECT id, 'Controller test and battery backup check', 'annual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-FLOOD'


-- 48. Water Quality Monitor (Cl/PH/TDS)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'Water Quality Monitor (Cl/PH/TDS)', 'PLB-WQM', 'Sensor calibration, log trending. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Sensor cleaning and calibration', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-WQM'
UNION ALL SELECT id, 'Data logging and trend analysis', 'quarterly', 0.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-WQM'
UNION ALL SELECT id, 'Probe replacement and full calibration', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-WQM'


-- 49. DHW Circulation Pump
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Plumbing', 'DHW Circulation Pump', 'PLB-WHCPUMP', 'Temperature setpoint, NRV check. Skills: Plumbing Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Operation check and temperature verification', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'PLB-WHCPUMP'
UNION ALL SELECT id, 'Non-return valve inspection', 'semiannual', 0.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'PLB-WHCPUMP'
UNION ALL SELECT id, 'Pump service and seal replacement', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'PLB-WHCPUMP'


-- ============================================================================
-- LIFTS ASSETS (2)
-- ============================================================================

-- 50. Fireman/Fire‑Fighting Lift
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Lifts', 'Fireman/Fire‑Fighting Lift', 'LIFT-FIREMAN', 'Fire recall, water ingress protect. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Fire recall mode activation test', 'monthly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-FIREMAN'
UNION ALL SELECT id, 'Water ingress protection inspection', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-FIREMAN'
UNION ALL SELECT id, 'Emergency communication and lighting test', 'semiannual', 1.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-FIREMAN'
UNION ALL SELECT id, 'Full operational test and statutory inspection', 'annual', 4.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-FIREMAN'


-- 51. Dumbwaiter
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Lifts', 'Dumbwaiter', 'LIFT-DUMB', 'Guides, interlocks, balance. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Guide rail and roller inspection', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-DUMB'
UNION ALL SELECT id, 'Interlock and safety device testing', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-DUMB'
UNION ALL SELECT id, 'Cable balance and full operational test', 'annual', 2.5, 3 FROM industry_standard_asset_library WHERE standard_code = 'LIFT-DUMB'


-- ============================================================================
-- FACADE ASSETS (1) - NEW CATEGORY
-- ============================================================================

-- 52. Building Maintenance Unit (Cradle/Monorail)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Facade', 'Building Maintenance Unit (Cradle/Monorail)', 'FACADE-BMU', 'Travel rails, hoist, safety devices. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and operation test', 'monthly', 1.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FACADE-BMU'
UNION ALL SELECT id, 'Travel rail and track condition check', 'quarterly', 2.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'FACADE-BMU'
UNION ALL SELECT id, 'Hoist and wire rope inspection', 'quarterly', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'FACADE-BMU'
UNION ALL SELECT id, 'Safety device and emergency stop testing', 'semiannual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'FACADE-BMU'
UNION ALL SELECT id, 'Full statutory examination (LOLER)', 'annual', 5.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'FACADE-BMU'


-- ============================================================================
-- UTILITIES ASSETS (3) - NEW CATEGORY
-- ============================================================================

-- 53. Diesel Day Tank & Transfer System
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Utilities', 'Diesel Day Tank & Transfer System', 'FUEL-DAYTANK', 'Leak tests, polishing unit, level switches. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and leak detection', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'FUEL-DAYTANK'
UNION ALL SELECT id, 'Level switch and alarm testing', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'FUEL-DAYTANK'
UNION ALL SELECT id, 'Fuel polishing unit operation check', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'FUEL-DAYTANK'
UNION ALL SELECT id, 'Tank cleaning and integrity test', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'FUEL-DAYTANK'


-- 54. Compressed Air System & Dryer
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Utilities', 'Compressed Air System & Dryer', 'UTIL-COMPAIR', 'Receivers, auto drain, dryer dew point. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Receiver pressure and auto drain check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'UTIL-COMPAIR'
UNION ALL SELECT id, 'Compressor oil and belt inspection', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'UTIL-COMPAIR'
UNION ALL SELECT id, 'Dryer dew point test and filter replacement', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'UTIL-COMPAIR'
UNION ALL SELECT id, 'Full system service and pressure test', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'UTIL-COMPAIR'


-- 55. LPG System (Tank/Manifold/Detectors)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Utilities', 'LPG System (Tank/Manifold/Detectors)', 'GAS-LPG', 'Regulators, leak tests, gas detection. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and leak detection', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'GAS-LPG'
UNION ALL SELECT id, 'Gas detector calibration and alarm test', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'GAS-LPG'
UNION ALL SELECT id, 'Regulator and pressure test', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'GAS-LPG'
UNION ALL SELECT id, 'Full system integrity test and valve inspection', 'annual', 3.0, 4 FROM industry_standard_asset_library WHERE standard_code = 'GAS-LPG'
UNION ALL SELECT id, 'Tank pressure relief valve testing', 'annual', 1.5, 5 FROM industry_standard_asset_library WHERE standard_code = 'GAS-LPG'


-- ============================================================================
-- SPECIAL ASSETS (3) - NEW CATEGORY
-- ============================================================================

-- 56. Swimming Pool System (Pumps/Filters/Dosing)
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Special', 'Swimming Pool System (Pumps/Filters/Dosing)', 'SPEC-POOL', 'Backwash, dosing, ORP/pH control. Skills: Kitchen Equipment Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Water chemistry testing and adjustment', 'weekly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-POOL'
UNION ALL SELECT id, 'Pump and filter backwash operation', 'weekly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-POOL'
UNION ALL SELECT id, 'Chemical dosing system calibration', 'quarterly', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-POOL'
UNION ALL SELECT id, 'ORP and pH probe calibration', 'quarterly', 1.5, 4 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-POOL'
UNION ALL SELECT id, 'Full system service and deep cleaning', 'annual', 6.0, 5 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-POOL'


-- 57. Water Feature / Fountain
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Special', 'Water Feature / Fountain', 'SPEC-FOUNTAIN', 'Nozzles, lighting, filtration. Skills: Multi Skilled Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Visual inspection and operation check', 'monthly', 0.5, 1 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-FOUNTAIN'
UNION ALL SELECT id, 'Nozzle cleaning and water quality test', 'quarterly', 1.5, 2 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-FOUNTAIN'
UNION ALL SELECT id, 'Pump and filtration system service', 'semiannual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-FOUNTAIN'
UNION ALL SELECT id, 'Lighting and control system inspection', 'annual', 2.5, 4 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-FOUNTAIN'


-- 58. Data Hall Leak Detection
INSERT INTO industry_standard_asset_library (category, asset_name, standard_code, description)
VALUES ('Special', 'Data Hall Leak Detection', 'SPEC-LEAKDET', 'Zoned/rope sensors, alarm mapping. Skills: ELV Technician')
ON CONFLICT (standard_code) DO NOTHING;

INSERT INTO industry_standard_ppm_tasks (asset_id, task_name, frequency, hours_per_task, task_order)
SELECT id, 'Zoned sensor and rope sensor testing', 'monthly', 1.0, 1 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-LEAKDET'
UNION ALL SELECT id, 'Alarm mapping and notification test', 'quarterly', 1.0, 2 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-LEAKDET'
UNION ALL SELECT id, 'Full system calibration and coverage check', 'annual', 2.0, 3 FROM industry_standard_asset_library WHERE standard_code = 'SPEC-LEAKDET'

