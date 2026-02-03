export const systemOverview = `flowchart TD
  %% Main Modules
  GO_CORE[Core System & Upload]
  GO_FIRMWARE[Firmware Runtime]
  GO_ELECTRICAL[Electrical Power]
  GO_CONNECTIVITY[Connectivity (WiFi/BT)]
  GO_INPUT[Sensors & Input]
  GO_OUTPUT[Actuators & Output]

  %% Relationships
  GO_CORE --> GO_FIRMWARE
  GO_CORE --> GO_ELECTRICAL
  
  GO_FIRMWARE --> GO_INPUT
  GO_FIRMWARE --> GO_OUTPUT
  
  GO_INPUT --> GO_ELECTRICAL
  GO_INPUT --> GO_CONNECTIVITY
  
  GO_CONNECTIVITY --> GO_ELECTRICAL
  
  %% Styling
  classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
  classDef prominent fill:#e1f5fe,stroke:#0277bd,stroke-width:2px;
  class GO_CORE prominent;
`;
